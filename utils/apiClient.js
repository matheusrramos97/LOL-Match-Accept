const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { dialog } = require('electron');

class ApiClient {
    constructor(app) {
        this.app = app;
        const lockfilePath = this.findLockfile(app);
        if (lockfilePath) {
            const lockfileData = fs.readFileSync(lockfilePath, 'utf8');
            const [name, pid, port, authToken, protocol] = lockfileData.split(':');
            this.baseUrl = `${protocol}://127.0.0.1:${port}`;
            this.client = axios.create({
                baseURL: this.baseUrl,
                headers: {
                    'Authorization': `Basic ${Buffer.from(`riot:${authToken}`).toString('base64')}`,
                    'Content-Type': 'application/json',
                },
                httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
            });
        } else {
            throw new Error('Lockfile não encontrado ou não selecionado.');
        }
    }

    findLockfile(app) {
        const defaultPath = path.join('C:', 'Riot Games', 'League of Legends', 'lockfile');
        if (fs.existsSync(defaultPath)) {
            return defaultPath;
        } else {
            const userResponse = dialog.showMessageBoxSync({
                type: 'warning',
                buttons: ['Selecionar Pasta', 'Cancelar'],
                defaultId: 0,
                title: 'League of Legends não encontrado',
                message: 'Não foi possível localizar o League of Legends no diretório padrão. Por favor, selecione a pasta onde o League of Legends está instalado.'
            });

            if (userResponse === 0) { // Usuário escolheu "Selecionar Pasta"
                const selectedPath = dialog.showOpenDialogSync({
                    title: 'Selecione a pasta do League of Legends',
                    properties: ['openDirectory']
                });

                if (selectedPath && selectedPath.length > 0) {
                    const potentialLockfile = path.join(selectedPath[0], 'lockfile');
                    if (fs.existsSync(potentialLockfile)) {
                        return potentialLockfile;
                    } else {
                        dialog.showErrorBox('Erro', 'O arquivo lockfile não foi encontrado na pasta selecionada.');
                    }
                }
            } else {
                app.quit(); // Fecha o aplicativo se o usuário cancelar
            }

            return null;
        }
    }

    async getSummonerData() {
        try {
            const response = await this.client.get('/lol-summoner/v1/current-summoner');
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar dados do jogador:', error.message);
            throw error;
        }
    }

    async getReadyCheck() {
        try {
            const response = await this.client.get('/lol-matchmaking/v1/ready-check');
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar ready check:', error.message);
            throw error;
        }
    }

    async acceptReadyCheck() {
        try {
            const response = await this.client.post('/lol-matchmaking/v1/ready-check/accept');
            return response.data;
        } catch (error) {
            console.error('Erro ao aceitar a partida:', error.message);
            throw error;
        }
    }

    async readyCheckAndAccept() {
        try {
            console.log('Verificando o estado do ready check...');
            const readyCheck = await this.getReadyCheck();
            if (readyCheck.state === 'InProgress') {
                console.log('Ready check in progress, accepting...');
                await this.acceptReadyCheck();
                console.log('Accepted the match.');
            } else {
                console.log('No ready check in progress.');
            }
        } catch (error) {
            console.error('Erro ao verificar e aceitar a partida:', error.message);
        }
    }
}

module.exports = { ApiClient };
