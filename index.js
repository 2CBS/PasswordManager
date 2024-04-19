import readline from "readline";
import fs from "fs";
import chalk from "chalk";
import ora from "ora";

const dataFilePath = "./passwords.json";
const masterKey = "your_master_password";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const symbols = {
	success: chalk.green("✔"),
	error: chalk.red("✘"),
	warning: chalk.yellow("▶️"),
};

const { success, error, warning } = symbols;

const loadData = () => {
	try {
		if (!fs.existsSync(dataFilePath)) {
			console.log(`${chalk.red(error + " Data file does not exist. Creating new file...")}`);
			saveData([]);
			return [];
		}
		return JSON.parse(fs.readFileSync(dataFilePath));
	} catch (error) {
		console.error(`${chalk.red(error + " Error loading data from file:")}`);
		console.error(error);
		return [];
	}
};

const saveData = (data) => {
	try {
		fs.writeFileSync(dataFilePath, JSON.stringify(data));
	} catch (error) {
		console.error(`${chalk.red(error + " Error saving data to file:")}`);
		console.error(error);
	}
};

const addPassword = (website, usernameOrEmail, password) => {
	const data = loadData();

	if (website === undefined || usernameOrEmail === undefined || password === undefined) {
		console.error(
			`${chalk.red(error + " Missing arguments.")}  ${chalk.grey(
				"add <website> <username/email> <password>",
			)}`,
		);
		showMenu();
		return;
	}

	const isEmail = usernameOrEmail.includes("@");
	data.push({
		website,
		[isEmail ? "email" : "username"]: usernameOrEmail,
		password,
	});

	saveData(data);
	console.log(`${chalk.green(success + " Account added successfully!")}`);

	showMenu();
};

const listPasswords = () => {
	const data = loadData();
	if (data.length === 0) {
		console.log(`${chalk.yellow(warning + " No passwords saved.")}`);
		showMenu();
		return;
	}
	console.log(chalk.white.bold("Saved Passwords:"));
	data.forEach(({ website, email, username, password }, index) => {
		const identifier = email ? "Email" : "Username";
		const value = email || username;
		console.log(
			`${index + 1}. Website: ${chalk.cyan(website)}, ${identifier}: ${chalk.cyan(
				value,
			)}, Password: ${chalk.cyan(password)}`,
		);
	});
	showMenu();
};

const removePassword = (index) => {
	const data = loadData();
	if (index < 0 || index >= data.length) {
		console.error(`${chalk.red(error + " Invalid index.")}`);
		showMenu();
		return;
	}
	const { website, username, email, password } = data[index];
	rl.question(
		`${chalk.yellow(
			warning +
				` Are you sure you want to remove the password for ${chalk.cyan(
					` ${website}/${email || username}:${"*".repeat(password.length)}`,
				)}? `,
		)} (yes/no): `,
		(answer) => {
			if (answer.toLowerCase() === "yes" || answer.toLowerCase() === "y") {
				data.splice(index, 1);
				saveData(data);
				console.log(`${chalk.green(success + " Password removed successfully!")}`);
			} else {
				console.log(`${chalk.yellow(warning + " Operation canceled.")}`);
			}
			showMenu();
		},
	);
};

const updatePassword = (index, newWebsite, newUsername, newPassword) => {
	const data = loadData();

	if (
		index === undefined ||
		newWebsite === undefined ||
		newUsername === undefined ||
		newPassword === undefined
	) {
		console.error(
			`${chalk.red(error + " Missing arguments.")}  ${chalk.grey(
				"update <index> <newWebsite> <newUsername/email> <newPassword>",
			)}`,
		);
		showMenu();
		return;
	}

	if (index < 0 || index >= data.length) {
		console.error(`${chalk.red(error + " Invalid index.")}`);
		showMenu();
		return;
	}

	const entry = data[index];
	rl.question(
		`${chalk.yellow(
			warning +
				` Are you sure you want to update the password for ${chalk.cyan(
					` ${entry.website}/${entry.username}:${"*".repeat(entry.password.length)}`,
				)}? `,
		)} (yes/no): `,
		(answer) => {
			if (answer.toLowerCase() === "yes" || answer.toLowerCase() === "y") {
				entry.website = newWebsite;
				entry.username = newUsername;
				entry.password = newPassword;
				saveData(data);
				console.log(`${chalk.green(success + " Password updated successfully!")}`);
			} else {
				console.log(`${chalk.yellow(warning + " Operation canceled.")}`);
			}
			showMenu();
		},
	);
};

const purgePasswords = (masterPassword) => {
	if (masterPassword === undefined) {
		console.error(
			`${chalk.red(error + " Missing master password.")}  ${chalk.grey(
				"purge <masterPassword>",
			)}`,
		);
		showMenu();
		return;
	}

	if (masterPassword === masterKey) {
		rl.question(
			`${chalk.yellow(
				warning +
					" Are you sure you want to purge all saved passwords? This action cannot be undone.",
			)} (yes/no): `,
			(answer) => {
				if (answer.toLowerCase() === "yes" || answer.toLowerCase() === "y") {
					saveData([]);
					console.log(
						`${chalk.green(success + " All saved passwords purged successfully!")}`,
					);
				} else {
					console.log(`${chalk.yellow(warning + " Operation canceled.")}`);
				}
				showMenu();
			},
		);
	} else {
		console.log(
			`${chalk.red(error + " Master password incorrect. Purge operation aborted.")} `,
		);
		showMenu();
	}
};

const showMenu = () => {
	console.log(chalk.cyan("\nWhat would you like to do?"));
	rl.prompt("\n");
};

const showHelp = () => {
	const categories = [
		{
			title: chalk.white.bold("Managing Passwords:"),
			commands: [
				{
					command: "add <website> <username/email> <password>",
					description: "Add a new account entry.",
				},
				{ command: "list[ls]", description: "List all saved accounts." },
				{ command: "remove[rm] <index>", description: "Remove an account entry by index." },
				{
					command: "update[edit] <index> <newWebsite> <newUsername/email> <newPassword>",
					description: "Update a password entry.",
				},
				{
					command: "purge[prune] <masterPassword>",
					description: "Delete all saved passwords with master password verification.",
				},
			],
		},
		{
			title: chalk.white.bold("Other Commands:"),
			commands: [
				{ command: "help", description: "Show this help menu." },
				{ command: "clear", description: "Clear the screen." },
        { command: "credits", description: "Display the authors links." },
				{ command: "exit", description: "Exit the password manager." },
			],
		},
	];

	categories.forEach(({ title, commands }) => {
		console.log(title);
		commands.forEach(({ command, description }) => {
			console.log(chalk.cyan(command), "-", description);
		});
	});

	showMenu();
};

const processCommand = (input) => {
	const [command, ...args] = input.trim().split(" ");

	switch (command.toLowerCase()) {
		case "add":
		case "new":
			addPassword(...args);
			break;
		case "list":
		case "ls":
			listPasswords();
			break;
		case "remove":
		case "rm":
			removePassword(parseInt(args[0]) - 1);
			break;
		case "update":
		case "edit":
			updatePassword(parseInt(args[0]) - 1, ...args.slice(1));
			break;
		case "purge":
		case "prune":
			purgePasswords(args[0]);
			break;
		case "help":
			showHelp();
			break;
		case "clear":
		case "cls":
			console.clear();
			main();
			break;
		case "exit":
			console.log(chalk.cyan("Exiting..."));
			rl.close();
			break;
		case "credits":
			console.log(
				chalk.cyan.bold("This was coded by meta.") +
					chalk.cyan.italic("\nhttps://github.com/2cbs\nhttps://metas.codes"),
			);
			showMenu();
			break;
		default:
			console.error(`${chalk.red(error + " Invalid command. Type 'help' for assistance.")}`);
			showMenu();
	}
};

const main = () => {
	console.clear();
	console.log(chalk.cyan.bold("Welcome to the Password Manager!"));
	console.log(chalk.dim("Type 'help' to see available commands."));
	showMenu();
};

main();

rl.on("line", processCommand);
