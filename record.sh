#!/bin/bash
# Needs to be cleaned up for generic use, but this will do for now.
echo This is the filename to be used $1
echo hdhomerun_config 103DA852 set /tuner$5/channel auto:$2
hdhomerun_config 103DA852 set /tuner$5/channel auto:$2
echo hdhomerun_config 103DA852 set /tuner$5/program $3
hdhomerun_config 103DA852 set /tuner$5/program $3
echo timeout $4 hdhomerun_config 103DA852 save /tuner$5 /media/dvr/dvr/$1.ts
timeout $4 hdhomerun_config 103DA852 save /tuner$5 /media/dvr/dvr/$1.ts
