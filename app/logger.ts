type DevLogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface DevLogOptions {
	filePath?: string;
	scope?: string;
}

const isNodeRuntime = () => (
	typeof process !== 'undefined' && !!process.versions?.node
);

export const DEFAULT_DEV_LOG_FILE_PATH = isNodeRuntime()
	? `${process.cwd()}/logs/bcsv_web.dev.log`
	: 'logs/bcsv_web.dev.log';

const isEnabledRuntime = () => (
	isNodeRuntime() && process.env.NODE_ENV !== 'production'
);

const resolveLogFilePath = (filePath?: string) => (
	filePath ?? process.env.DEV_LOG_FILE_PATH ?? DEFAULT_DEV_LOG_FILE_PATH
);

const getDirectoryPath = (filePath: string) => {
	const normalizedPath = filePath.replace(/\\/g, '/');
	const lastSlashIndex = normalizedPath.lastIndexOf('/');

	if (lastSlashIndex === -1) {
		return '.';
	}

	return normalizedPath.slice(0, lastSlashIndex) || '.';
};

const serializePayload = (payload?: unknown) => {
	if (payload === undefined) {
		return '';
	}

	if (payload instanceof Error) {
		return JSON.stringify({
			name: payload.name,
			message: payload.message,
			stack: payload.stack,
		});
	}

	if (typeof payload === 'string') {
		return payload;
	}

	try {
		return JSON.stringify(payload);
	} catch {
		return String(payload);
	}
};

type FsPromisesModule = {
	appendFile: (path: string, data: string, encoding: 'utf8') => Promise<void>;
	mkdir: (path: string, options: { recursive: true }) => Promise<void | string>;
};

const loadFsPromises = async (): Promise<FsPromisesModule | null> => {
	if (!isNodeRuntime()) {
		return null;
	}

	const importModule = new Function(
		'specifier',
		'return import(specifier);'
	) as (specifier: string) => Promise<FsPromisesModule>;

	return importModule('fs/promises');
};

const writeLogLine = async (filePath: string, logLine: string) => {
	const fsPromises = await loadFsPromises();
	if (!fsPromises) {
		return;
	}

	const { appendFile, mkdir } = fsPromises;
	await mkdir(getDirectoryPath(filePath), { recursive: true });
	await appendFile(filePath, `${logLine}\n`, 'utf8');
};

const logToDevFile = async (
	level: DevLogLevel,
	message: string,
	payload?: unknown,
	options: DevLogOptions = {}
) => {
	if (!isEnabledRuntime()) {
		return;
	}

	const scopeSegment = options.scope ? ` [${options.scope}]` : '';
	const payloadSegment = serializePayload(payload);
	const logLine = `${new Date().toISOString()} ${level}${scopeSegment} ${message}${payloadSegment ? ` ${payloadSegment}` : ''}`;

	try {
		await writeLogLine(resolveLogFilePath(options.filePath), logLine);
	} catch (error) {
		console.error('Failed to write development log entry', error);
	}
};

export const devLogger = {
	log: (message: string, payload?: unknown, options?: DevLogOptions) => (
		logToDevFile('INFO', message, payload, options)
	),
	warn: (message: string, payload?: unknown, options?: DevLogOptions) => (
		logToDevFile('WARN', message, payload, options)
	),
	error: (message: string, payload?: unknown, options?: DevLogOptions) => (
		logToDevFile('ERROR', message, payload, options)
	),
};

export const logDev = devLogger.log;
