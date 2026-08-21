#!/usr/bin/env bash
# Fixture: deliberately wrong. It parses, so `bash -n` accepts it. Static
# analysis has to be the thing that rejects it.
target=$1
rm -rf $target/releases
echo "removed" > /tmp/$target.log
