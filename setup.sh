#!/bin/sh

sudo apt-get -y update
sudo apt-get -y upgrade
sudo apt-get -y install g++ curl libssl-dev apache2-utils
sudo apt-get -y install git-core
sudo apt-get -y update
sudo apt-get install -y python-software-properties python g++ make
sudo add-apt-repository -y ppa:chris-lea/node.js
sudo apt-get -y update
sudo apt-get -y install nodejs
curl https://npmjs.org/install.sh | sudo sh
sudo apt-get -y install ffmpeg libavcodec-extra-53
