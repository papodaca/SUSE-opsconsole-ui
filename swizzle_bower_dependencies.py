#!/usr/bin/env python
# (c) Copyright 2016 Hewlett Packard Enterprise Development LP
import json
import httplib
import sys

internal_git = "git.gozer.hpcloud.net"
gozer_git_mirror = "http://git00.ae1.gozer.hpcloud.net/hp/branding-assets"

try:
    connection = httplib.HTTPConnection(internal_git, 80, timeout=5)
    connection.request("GET", "/")
    response = connection.getresponse()
    if response.status < 500:
        print "Connected to ineral git successfully, exiting."
        sys.exit()
except Exception:
    print "Could not connect to default git mirror, using alternate."

with open('bower.json', 'r+') as bower_json_file:
    bower_json = json.load(bower_json_file)
    bower_json["dependencies"]["grommet-branding-assets"] = \
        "git+%s" % (gozer_git_mirror)
    print "Saving modified bower.json with: " + \
        bower_json["dependencies"]["grommet-branding-assets"]
    bower_json_file.seek(0)
    json.dump(bower_json, bower_json_file, indent=4)
