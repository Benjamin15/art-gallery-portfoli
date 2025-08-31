/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string

// Provide global spark typing for shim
declare global {
	interface Window {
		spark?: any
	}
	// Free variable used across codebase
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	var spark: any
}

export {}
