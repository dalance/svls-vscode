import * as path from 'path';
import { commands, workspace, ExtensionContext, window, Uri } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient';

let client: LanguageClient;

function startServer() {
	// Get the configured .svlint.toml config path from user/workspace settings
	let svlint_config: string | undefined = workspace.getConfiguration("svls-vscode").get("svlintToml.path");
	if (typeof svlint_config !== undefined)	process.env.SVLINT_CONFIG = svlint_config;

	let svls_binary_path: string | undefined = workspace.getConfiguration("svls-vscode").get("svlsBinary.path");
	if (typeof svls_binary_path === "undefined")	svls_binary_path = "svls";
	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: {command: svls_binary_path},
		debug: {command: svls_binary_path, args: ["--debug"]},
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'systemverilog' }],
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'svls',
		'SystemVerilog language server',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

function stopServer(): Thenable<void> {
	if (!client) {
		return Promise.resolve();
	}
	return client.stop();
}

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		commands.registerCommand("svls-vscode.setSvlintTomlPath", () => {
			window.showOpenDialog({
				canSelectFiles: true,
				canSelectMany: false,
				defaultUri: Uri.file("/"),
				filters: {"Toml": ["toml"]},
				openLabel: "Set config.toml"
			}).then((fileUri: Uri[] | undefined) => {
				if (fileUri && fileUri[0]) {
					workspace.getConfiguration("svls-vscode").update("svlintToml.path", fileUri[0].fsPath)
					window.showInformationMessage("Reload the window to use the selected svlint configuration");
				}
			})
		}),
		commands.registerCommand("svls-vscode.restartSvls", () => {
			stopServer().then(startServer, startServer);
		})
	)

	startServer();
}

export function deactivate(): Thenable<void> {
	return stopServer();
}
