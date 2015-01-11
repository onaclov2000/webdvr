#!/bin/bash
hdhomerun_config $5 set /tuner0/channel auto:$2
hdhomerun_config $5 set /tuner/program $3
timeout $4 hdhomerun_config $5 save /tuner0 $1.ts
