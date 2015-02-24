webdvr
======

Web based DVR scheduling for HDHomerun using Raspberry Pi, NodeJS and Firebase.

How it works
=============
Start with:

    git clone https://github.com/onaclov2000/webdvr.git

Next:

You'll have to choose a firebase reference, I picked a project and used /dvr as the endpoint.

Next: 
Make sure to update controller.js to contain a path to your firebase reference.

Place controller.js and index.html into your web hosting location.

Next:

Update config.js to point to the same firebase reference as your angularjs app.

Next: 

Ensure you install the HDHomerun command line tools. 

Next:
Run the command otherwise it won't work

    chmod +x record.sh

Update record.sh to point to your particular Tuner (just update the name), as well as where you want recordings to land.

Run the following:
    npm install

Finally start the server on your host PC

    node app.js

At that point things are ready.

TODO LIST (Make suggestions or pull requests please!)
==========
1. Update documentation Make things clearer, better directions.
2. Manage Schedule Conflicts
3. Optionally use second tuner
4. Ensure Naming makes sense for all that is recorded.
5. Upgrade to using HDHomerun nodejs package (currently using shell script with hdhomerun_config installed).
6. Store off recording history (for failure conditions).
7. Implement Record Now (and start recording if no conflicts exist, rather than in the past).
8. Enable Complete Series recording.
9. Enable New episodes recording I'm thinking program ID lookup based, should we use tvguide, or another service?
10. Replace boring text with pictures (a la netflix style).
11. Combine config.js and angularjs's firebase reference into one file, so you copy/paste the same file in two places.
12. Figure out "newness" of episode, I *think* AiringAttrib 44 means new, but there are others (I'm certain of that), not sure how to tell.
