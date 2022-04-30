#!/bin/bash

if [ -d "dist" ] ; then 
    rm -r -- dist
fi
 
PACKAGE_VERSION=$(  awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)
echo "Building anyCiCd-$PACKAGE_VERSION"

function pack(){
    cd dist
    for file in * ; do
        mkdir "dir_$file"
        mv "$file" "dir_$file/"
        cp ../sample.env  "dir_$file"
        mv  "dir_$file"  "$file"
        zip -9 -r "$file.zip" "$file"
        echo $file  
    done
}
 
function generic(){
    npx pkg --config package.json  -o "./dist/anyCiCd-$PACKAGE_VERSION" ./bin/www
    pack
}
function rpi(){
    npx pkg --config rpi_build_conf.json -o "./dist/anyCiCd-$PACKAGE_VERSION" ./bin/www
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