const argv = require('yargs/yargs')(process.argv.slice(2)).argv;
require('dotenv').config()

/**
 * configuration page
 */
let creds = {
    email: process.env.COUSCOUS_FUSEEMAIL,
    pwd: process.env.COUSCOUS_FUSEPWD,
    directory: process.env.COUSCOUS_DMOUNT
};

// console.log(argv)
const myArgs = argv.o||"";
creds.directory = (argv._ && argv._[0]) ||creds.directory
if (myArgs) {
    const args = myArgs.split(',')
    const argdiv = args.map(e=>e.split('='))

    const emailbit = argdiv.find(e=>e[0]==='username')
    const pwdbit = argdiv.find(e=>e[0]==='password')
    creds.email = (emailbit && emailbit[1])||creds.email
    creds.pwd = (pwdbit && pwdbit[1])||creds.pwd
    
}

console.log(creds);