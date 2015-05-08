
if [ "$1" = "discover" ]; then
   echo "hdhomerun device 103DA852 found at 169.254.52.210"
fi
#hdhomerun_config 103DA852 get /sys/debug
if [ "$2" = "get" ]; then
   echo "mem: nbm=117/99 qwm=1 npf=597 dmf=312"
   echo "loop: pkt=0"
   echo "t0: pt=11 cal=-494"
   echo "t1: pt=11 cal=-493"
   echo "eth: link=100f"
fi

if [ "$2" = "scan" ]; then
   echo "LOCK: none (ss=36 snq=0 seq=0)"
   echo "SCANNING: 695000000 (us-bcast:51)"
   echo "LOCK: 8vsb (ss=97 snq=92 seq=100)"
   echo "TSID: 0x1383"
   echo "PROGRAM 1: 30.1 KYNM-HD"
   echo "PROGRAM 2: 30.2 TUFF-TV"
   echo "PROGRAM 3: 30.3 Retro"
   echo "PROGRAM 4: 30.4 PBJ-TV"
   echo "PROGRAM 5: 30.5 QVC"
   echo "SCANNING: 689000000 (us-bcast:50)"
fi
