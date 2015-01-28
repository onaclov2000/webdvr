webdvr
======

Web based DVR scheduling for HDHomerun using Raspberry Pi, NodeJS and Firebase.

How it works
=============
Place controller.js and index.html into your web hosting location.

You'll have to choose a firebase reference, I picked a project and used /dvr as the endpoint.

Make sure to update controller.js to contain a path to your firebase reference.

Place app.js, dvr.js, and tvguide.js into a folder on your host computer (I use a raspberry pi, although you can use your desktop, where node is ran from is largely irrelevant, except it MUST be on a lan/cat5/etc connection not wifi, it drops too many packets).

Update config.js to point to the same firebase reference as your angularjs app.

Ensure you install the HDHomerun command line tools. 

Update record.sh to point to your particular Tuner (just update the name), as well as where you want recordings to land.

You'll need to npm install some stuff, in particular, firebase and node-schedule.

Finally start the server on your host PC

    node app.js

TODO LIST (Make suggestions or pull requests please!)
==========
1. Manage Schedule Conflicts
2. Optionally use second tuner
3. Ensure Naming makes sense for all that is recorded.
4. Upgrade to using HDHomerun nodejs package (currently using shell script with hdhomerun_config installed).
5. Store off recording history (for failure conditions).
6. Implement Record Now (and start recording if no conflicts exist, rather than in the past).
7. Enable Complete Series recording.
8. Enable New episodes recording I'm thinking program ID lookup based, should we use tvguide, or another service?
9. Replace boring text with pictures (a la netflix style).
10. Combine config.js and angularjs's firebase reference into one file, so you copy/paste the same file in two places.
