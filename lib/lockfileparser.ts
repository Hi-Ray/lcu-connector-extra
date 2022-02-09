import fs from 'fs-extra';

interface lockfile {
    process: string;
    PID: number;
    port: number;
    password: string;
    protocol: string;
}

class LockfileParser {
    get name() {
        return 'LockfileParser';
    }

    async parse(path: string) {
        let file;

        if (Buffer.isBuffer(path)) {
            file = path.toString();
        } else {
            file = await fs.readFile(path, 'utf8');
        }

        return file.split(':');
    }

    async read(path: string) {
        const parts = await this.parse(path);

        const lf: lockfile = {
            process: parts[0],
            PID: Number(parts[1]),
            port: Number(parts[2]),
            password: parts[3],
            protocol: parts[4],
        };

        return lf;
    }

    async extract(input: string, output: string) {
        const file = await this.read(input);
        await fs.outputJson(output, file, { spaces: 2 });
    }
}

export default LockfileParser;
