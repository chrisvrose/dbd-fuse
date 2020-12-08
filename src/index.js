#!/bin/env node
const Fuse = require('fuse-native');
const fuseops = require('./fsops');
const path = require('path');
const FSError = require('./misc/FSError');
const { O_RDONLY } = require('constants');

try {
    const dotenv = require('dotenv');
    dotenv.config();
} catch {
    console.log('I> did not set env vars');
}

// console.log(process.argv);

let pathToMount = process.argv[2] || './mnt';

const ops = {
    readdir: (path, cb) => {
        console.log('I>readdir', path);
        fuseops
            .readdir(path)
            .then(response => {
                const { contents, contexts } = response;
                return process.nextTick(cb, 0, contents, /*contexts*/);
            })
            .catch(err => {
                if (err instanceof FSError) {
                    return process.nextTick(cb, err.errno);
                } else {
                    return process.nextTick(cb, Fuse.EFAULT);
                }
                // console.log(err)
                // return process.nextTick(cb, Fuse.ENOENT)
            });
    },
    getattr: (path, cb) => {
        // console.log('I>getattr', path);
        fuseops
            .getattr(path)
            .then(response => {
                return process.nextTick(cb, 0, response);
            })
            .catch(err => {
                if (err instanceof FSError) {
                    return process.nextTick(cb, err.errno);
                } else {
                    return process.nextTick(cb, Fuse.EFAULT);
                }
            });
    },
    open: function (path, flags, cb) {
        console.log('I>open(%s, %d)', path, flags);
        fuseops
            .open(path, flags)
            .then(response => {
                return process.nextTick(cb, 0, response);
            })
            .catch(err => {
                if (err instanceof FSError) {
                    return process.nextTick(cb, err.errno);
                } else {
                    return process.nextTick(cb, Fuse.EFAULT);
                }
            });
    },
    release: function (path, fd, cb) {
        console.log('I>close(%s, %d)', path, fd);
        fuseops
            .close(path, fd)
            .then(() => {
                return process.nextTick(cb, 0);
            })
            .catch(err => {
                if (err instanceof FSError) {
                    return process.nextTick(cb, err.errno);
                } else {
                    return process.nextTick(cb, Fuse.EFAULT);
                }
            });
    },
    chmod: function (path,mode,cb){
        console.log('I>chmod(%s, %d)', path, mode);
        fuseops
            .chmod(path,mode)
            .then(() => {
                return process.nextTick(cb, 0);
            })
            .catch(err => {
                if (err instanceof FSError) {
                    return process.nextTick(cb, err.errno);
                } else {
                    return process.nextTick(cb, Fuse.EFAULT);
                }
            });
    },
    read: function (path,fd,buf,len,pos,cb){
        console.log('I>read(%s,%d)',path,fd);
        fuseops.read(path,fd,buf,len,pos).then(e=>{
            return process.nextTick(cb,e);
        }).catch(err=>{
            if (err instanceof FSError) {
                return process.nextTick(cb, err.errno);
            } else {
                return process.nextTick(cb, Fuse.EFAULT);
            }
        })
    },
    create: function(path,mode,cb){
        console.log('I>create(%s,%d)',path,mode)
        fuseops
            .create(path,mode)
            .then(() => {
                return process.nextTick(cb, 0);
            })
            .catch(err => {
                if (err instanceof FSError) {
                    return process.nextTick(cb, err.errno);
                } else {
                    return process.nextTick(cb, Fuse.EFAULT);
                }
            });
        // return process.nextTick(cb,Fuse.EHOSTUNREACH)
    },
    utimens: (path, atime, mtime, cb)=>{
        //dummy function
        console.log('I>changetimes(faking)',path,atime,mtime);
        return process.nextTick(cb,0);
    },
    mkdir:(path, mode, cb)=>{
        console.log('I>mkdir(%s,%d)',path,mode);
        fuseops
            .mkdir(path,mode)
            .then(() => {
                return process.nextTick(cb, 0);
            })
            .catch(err => {
                if (err instanceof FSError) {
                    return process.nextTick(cb, err.errno);
                } else {
                    return process.nextTick(cb, Fuse.EFAULT);
                }
            });

    },
    rename:(src, dest, cb)=>{
        console.log('I>rename(%s,%s)',src,dest);
        fuseops
            .rename(src,dest)
            .then(() => {
                return process.nextTick(cb, 0);
            })
            .catch(err => {
                if (err instanceof FSError) {
                    return process.nextTick(cb, err.errno);
                } else {
                    return process.nextTick(cb, Fuse.EFAULT);
                }
            });
    },
    rmdir:(pathstr,cb)=>{
        console.log('I>rmdir(%s)',pathstr);
        fuseops
            .rmdir(pathstr)
            .then(() => {
                return process.nextTick(cb, 0);
            })
            .catch(err => {
                if (err instanceof FSError) {
                    return process.nextTick(cb, err.errno);
                } else {
                    return process.nextTick(cb, Fuse.EFAULT);
                }
            });
    }
};

const fuse = new Fuse('./mnt', ops, { debug: process.env.FUSEDEBUG==='true', displayFolder: true });

/**
 * Mount FUSE
 */
fuseops
    .init()
    .then(() => {
        fuse.mount(err => {
            if (err) {
                throw err;
            }

            console.log('FS mounted at ' + fuse.mnt);
        });
    })
    .catch(err => {
        if (err instanceof FSError) {
            console.log('could not mount with error ', err.errno);
            process.exit(1);
            // return process.nextTick(cb, err.errno);
        } else {
            console.log('E>could not mount, general error:', err);
            process.exit(1);
            // return process.nextTick(cb, Fuse.EFAULT);
        }
    });

/**
 * Unmount FUSE on SIGINT
 */
process.once('SIGINT', () => {
    fuse.unmount(err => {
        if (err) {
            console.log(
                '\nFS at ' + fuse.mnt + ' could not be unmounted: ' + err
            );
            return;
        }
        fuseops.deinit().then(() => {
            console.log('I>Logged out');
        });
        console.log('\nFS at ' + fuse.mnt + ' successfully unmounted');
    });
});
