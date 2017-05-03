#!/bin/bash
# (c) Copyright 2016 Hewlett Packard Enterprise Development LP

# Exit this script if any command exits with a failure
set -o errexit

#export PHANTOMJS_CDNURL=http://third-party-mirrors.mpc-test.gozer.hpcloud.net/downloads/phantomjs/ariya/phantomjs/downloads

# Usage
#    runTests.sh [rebuild]
#
# If rebuild is specified as an argument, the
# product will be rebuilt without going through
# the entire process of destroying and rebuilding
# its environment
#
REBUILD=${1:-""}

export PATH=node_modules/.bin:$PATH

retry_install() {
  for ((I=1; I<4; I++)) ; do
    echo "Try #${I}: ${1}"
    $1 && break
  done
}

if [[ ! $REBUILD ]] ; then

    # make sure we are in a clean state
    rm -rf app/bower_components
    rm -rf node_modules
    rm -rf ~/.npm

    # download node to run the gulp targets in a defined environment

    # install third-party dependencies
    retry_install "npm install"
    retry_install "npm install bower"

    ./swizzle_bower_dependencies.py
    retry_install "bower install"
    git checkout bower.json
fi

export PATH=node_modules/.bin:$PATH

# clean up .tmp and dist folders, and the previous zip output
gulp clean
rm -f cloudsystem*.tar.gz

# run JShint and Karma unit tests
# starting with just the jshint target ("scripts" pipes the js files through jshint)
gulp gatecheck

# Package distribution
gulp dist

VERSION=$(python -c 'import sys, json; print json.load(sys.stdin)["version"]' < .tmp/version.json)
SHA=$(python -c 'import sys, json; print json.load(sys.stdin)["sha"][:6]' < .tmp/version.json)

# Publish the CS tarball into the top level dir
tar -czvf cloudsystem-ui.tar.gz dist.cs

# Publish the HOS tarball into the dist dir
mkdir dist
tar -czvf dist/cloudsystem-ui-${VERSION}-${SHA}.hos.tar.gz dist.hos

echo "debugging ops console release job-----"
ls -la
ls -la dist
