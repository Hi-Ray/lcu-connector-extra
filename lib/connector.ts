import cp from 'child_process';
import chokidar from 'chokidar';
import { EventEmitter } from 'events';
import fs from 'fs-extra';
import path from 'path';
import LockfileParser from './lockfileparser';

const lockfile = new LockfileParser();

const IS_WIN = process.platform === 'win32';
const IS_MAC = process.platform === 'darwin';

interface ConnectorData {
    protocol: string;
    address: string;
    username: string;
    password: string;
    port: number;
}

export default class LCUConnector extends EventEmitter {
    private _dirPath: string | undefined;
    private _lockfileWatcher: any;
    private _processWatcher: NodeJS.Timer | undefined;

    static getLCUPathFromProcess() {
        return new Promise<void | string>((resolve) => {
            const INSTALL_REGEX_WIN = /"--install-directory=(.*?)"/;
            const INSTALL_REGEX_MAC = /--install-directory=(.*?)( --|\n|$)/;
            const INSTALL_REGEX = IS_WIN ? INSTALL_REGEX_WIN : INSTALL_REGEX_MAC;
            const command = IS_WIN
                ? `WMIC PROCESS WHERE name='LeagueClientUx.exe' GET commandline`
                : `ps x -o args | grep 'LeagueClientUx'`;

            cp.exec(command, (err, stdout, stderr) => {
                if (err || !stdout || stderr) {
                    resolve();
                    return;
                }

                const parts = stdout.match(INSTALL_REGEX) || [];
                resolve(parts[1]);
            });
        });
    }

    static isValidLCUPath(dirPath: string | undefined) {
        if (!dirPath) {
            return false;
        }

        const lcuClientApp = IS_MAC ? 'LeagueClient.app' : 'LeagueClient.exe';
        const common = fs.existsSync(path.join(dirPath, lcuClientApp)) && fs.existsSync(path.join(dirPath, 'Config'));
        const isGlobal = common && fs.existsSync(path.join(dirPath, 'RADS'));
        const isCN = common && fs.existsSync(path.join(dirPath, 'TQM'));

        return isGlobal || isCN || common;
    }

    constructor(executablePath?: string) {
        super();

        if (executablePath) {
            this._dirPath = path.dirname(path.normalize(executablePath));
        }
    }

    start() {
        if (LCUConnector.isValidLCUPath(this._dirPath)) {
            this._initLockfileWatcher();
            return;
        }

        this._initProcessWatcher().catch(console.error);
    }

    stop() {
        this._clearProcessWatcher();
        this._clearLockfileWatcher();
    }

    _initLockfileWatcher() {
        if (this._lockfileWatcher) {
            return;
        }

        const lockfilePath = path.join(<string>this._dirPath, 'lockfile');

        this._lockfileWatcher = chokidar.watch(lockfilePath, { disableGlobbing: true });

        this._lockfileWatcher.on('add', this._onFileCreated.bind(this));
        this._lockfileWatcher.on('change', this._onFileCreated.bind(this));
        this._lockfileWatcher.on('unlink', this._onFileRemoved.bind(this));
    }
    _clearLockfileWatcher() {
        if (this._lockfileWatcher) {
            this._lockfileWatcher.close();
        }
    }

    _initProcessWatcher() {
        return LCUConnector.getLCUPathFromProcess().then((lcuPath) => {
            if (lcuPath) {
                this._dirPath = lcuPath;
                this._clearProcessWatcher();
                this._initLockfileWatcher();
                return;
            }

            if (!this._processWatcher) {
                this._processWatcher = setInterval(this._initProcessWatcher.bind(this), 1000);
            }
        });
    }

    _clearProcessWatcher() {
        clearInterval(<NodeJS.Timeout>this._processWatcher);
    }

    _onFileCreated(path: string) {
        lockfile.read(path).then((data) => {
            const result: ConnectorData = {
                protocol: data.protocol,
                address: '127.0.0.1',
                port: data.port,
                username: 'riot',
                password: data.password,
            };

            this.emit('connect', result);
        });
    }

    _onFileRemoved() {
        this.emit('disconnect');
    }
}
