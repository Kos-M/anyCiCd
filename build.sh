#!/bin/bash
set -Eeuo pipefail

if [ -d "built" ] ; then 
    rm -r -- built
fi
 
PACKAGE_VERSION=$(  awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)
 function getHash(){
    git rev-parse --short HEAD
 }

echo "Building anyCiCd-$PACKAGE_VERSION #$(getHash)"

function pack(){
    if [ ! -d "built" ] ; then 
        echo "build dir not found , abort packing.."
        return
    fi
    cd built
    for file in * ; do
        mkdir "dir_$file"
        mv "$file" "dir_$file/"
        cp ../sample.env  "dir_$file"
        mkdir "dir_$file/exec"
        mv  "dir_$file"  "$file"
        zip -9 -r "$file.zip" "$file"
        echo $file  
    done
}
 
function generic(){
    npx pkg --config dist/package.json  -o "./built/anyCiCd-$PACKAGE_VERSION-$(getHash)-generic" ./dist/bin/www.js
    pack
}
function rpi(){
    npx pkg --config rpi_build_conf.json -o "./built/anyCiCd-$PACKAGE_VERSION-$(getHash)-rpi"  ./dist/bin/www.js
    pack
}

case "$1" in
        generic)
            generic
            exit
            ;;
        rpi)
            rpi
            exit
            ;;
        *)
            echo $"Usage: $0 {generc|rpi}"
            exit 1
esac