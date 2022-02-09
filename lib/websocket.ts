import WebSocket from 'ws';

const MESSAGE_TYPES = {
    WELCOME: 0,
    PREFIX: 1,
    CALL: 2,
    CALLRESULT: 3,
    CALLERROR: 4,
    SUBSCRIBE: 5,
    UNSUBSCRIBE: 6,
    PUBLISH: 7,
    EVENT: 8,
    TYPE_ID_CALLERROR: undefined,
};

class RiotWSProtocol extends WebSocket {
    private session: null;
    constructor(url: string) {
        super(url, 'wamp');

        this.session = null;
        this.on('message', this._onMessage.bind(this));
    }

    close() {
        super.close();
        this.session = null;
    }

    terminate() {
        super.terminate();
        this.session = null;
    }

    subscribe(topic: string, callback: (code: number, reason: Buffer) => void) {
        super.addListener(topic, callback);
        this.send(MESSAGE_TYPES.SUBSCRIBE, topic);
    }

    unsubscribe(topic: string, callback: (code: number, reason: Buffer) => void) {
        super.removeListener(topic, callback);
        this.send(MESSAGE_TYPES.UNSUBSCRIBE, topic);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    send(type: string | number, message: string | undefined) {
        super.send(JSON.stringify([type, message]));
    }

    _onMessage(message: string) {
        const [type, ...data] = JSON.parse(message);

        switch (type) {
            case MESSAGE_TYPES.WELCOME:
                this.session = data[0];
                // this.protocolVersion = data[1];
                // this.details = data[2];
                break;
            case MESSAGE_TYPES.CALLRESULT:
                console.log(
                    'Unknown call, if you see this file an issue at https://discord.gg/hPtrMcx with the following data:',
                    data,
                );
                break;
            case MESSAGE_TYPES.TYPE_ID_CALLERROR:
                console.log(
                    'Unknown call error, if you see this file an issue at https://discord.gg/hPtrMcx with the following data:',
                    data,
                );
                break;
            case MESSAGE_TYPES.EVENT:
                const [topic, payload] = data;
                this.emit(topic, payload);
                break;
            default:
                console.log(
                    'Unknown type, if you see this file an issue with at https://discord.gg/hPtrMcx with the following data:',
                    [type, data],
                );
                break;
        }
    }
}

export default RiotWSProtocol;
