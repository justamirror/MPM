const fs = require('fs')
const fetch = require('node-fetch')
const path = require('path')
const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
})
const util = require('util');
const input = util.promisify(rl.question)
const url = 'https://mlangpackagehosting.justa6.repl.co/'



mlang_path = path.join(   __dirname, 'mlang'   )




function username_password(callback){
    rl.question("Username ", (username)=>{
        rl.question("Password ", (password)=>{
            callback(username, password)
            return
        })
    })
}
async function login(callback){
  username_password(async (username, password)=>{
    const data = JSON.stringify({
            username,
            password
    })
    const resp = await fetch(url+'login', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        },
        body: data,
    })
    callback(await resp.text())
  })
}

async function signup(){
  username_password(async (username, password)=>{
    const data = JSON.stringify({
            username,
            password
    })
    const resp = await fetch(url+'signup', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        },
        body: data,
    })
    console.log(await resp.text())
    process.exit(0)
  })
}

function encode(dir, foldername){
    console.log('Uploading '+foldername)
    const contents = fs.readdirSync(foldername)
    for (let i in contents){
        if (fs.lstatSync(foldername+'/'+contents[i]).isDirectory()){
            dir[contents[i]] = {}
            encode(dir[contents[i]], foldername+'/'+contents[i])
        } else {
            console.log('Uploading '+foldername+'/'+contents[i])
            dir[contents[i]] = fs.readFileSync(foldername+'/'+contents[i]).toString()
        }
    }
    return dir
}
function decode(dir, foldername){
    if (fs.existsSync(foldername)){
        fs.rmdirSync(foldername);
    }
    fs.mkdirSync(foldername)
    console.log("Created "+foldername)
    for (let i in dir){
        if (typeof dir[i] !=='string'){
            decode(dir[i], foldername+'/'+i)
        } else {
            fs.writeFileSync(foldername+'/'+i, dir[i])
            console.log("Created "+foldername+'/'+i)
        }
    }
}
async function upload(name, dirn){
  login(async (token)=>{
    console.log(name, dirn)
    if (name===undefined){
        console.log("Name was not provided.")
        return process.exit(0)
    }
    if (dirn===undefined){
        console.log("Directory was not provided.")
        return process.exit(0)
    }
    console.log("Uploading "+dirn+" as "+name+'\n')
    var dir = encode({}, dirn)
    var data = JSON.stringify({
        token, 
        dir,
        name,
    })
    resp = await fetch(url+'upload', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        },
        body: data,
    })
    console.log('\n'+await resp.text())
    process.exit(0)
  })
}
async function add_package(name){
    if (name===undefined){
        console.log('You havent specified the package to install.')
        return
    }
    resp = await fetch(url+'package/'+name)
    resp = await resp.text()
    if (resp==='null'){
        console.log("Package "+name+" doesnt exist.")
    } else {
        console.log("Adding package "+name+"\n")
        decode(JSON.parse(resp), mlang_path+'/ExecProc/core/modules/'+name)
        console.log('\nFinished.')
    }
    process.exit(0)
}

var args = process.argv.slice(2)
async function handle_args(){
    switch (args[0]){
        case 'signup':
            await signup()
            break
        case 'install':
            await add_package(args[1])
            break
        case 'upload':
            console.log(args, args[1], args[2])
            await upload(args[1], './'+args[2])
            break
        case undefined:
            console.log("MPM signup - sign up for mpm account")
            console.log("MPM install <packagename> - install package called packagename")
            console.log("MPM upload <packagename> <path> - upload the directory path to mpm as packagename")
            process.exit(0)
            break
        default:
            console.log("Command "+args[0]+' not found.')
            process.exit(0)
            break
    }
}
handle_args()
