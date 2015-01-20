#!/bin/bash
# Needs to be cleaned up for generic use, but this will do for now.
hdhomerun_config 103DA852 set /tuner0/channel auto:$2
hdhomerun_config 103DA852 set /tuner0/program $3
timeout $4 hdhomerun_config 103DA852 save /tuner0 /media/dvr/dvr/$1.ts
sleep $4
sleep 5000
avconv -i /media/dvr/dvr/$1.ts -vcodec libx264 -ac 2 -strict experimental /media/dvr/dvr/$1.m4v
