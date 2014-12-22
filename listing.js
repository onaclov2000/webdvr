        function getAntennaPredictions(updateBounds) {
            //update the hidden fields so the cookie can be updated.                      
            $("#loading").fadeIn();

            var obstructed = (currentAddress.isObstructed == "True");
            var serviceCall = {
                type: "POST",
                url: document.location.pathname + "/GetAntennaPredictions",
                data: '{"latitude":' + currentAddress.location.lat() + ',"longitude":' + currentAddress.location.lng() + ',"height":' + currentAddress.receiveHeight + ',"obstructed":' + obstructed + '}',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (data, textStatus, jqXHR) {

                    var awr = new Array();
                    $(data.d.Stations).each(function () {

                        var callSign = this.call_sign;
                        var color = this.antenna_color;
                        var rfChannel = this.rf_channel;
                        var psipChannel = this.psip_channel;
                        var channel = psipChannel;
                        if (channel.length == 0)
                            channel = this.rf_channel;
                        var band = "vhf";
                        if (parseInt(rfChannel) > 13)
                            band = "uhf";
                        var network = this.network;
                        var directionTrue = this.direction_true;
                        var distance = this.distance;
                        var stationId = this.station_id;
                        var signalStrength = this.signal_strength;
                        var broadcastType = this.broadcast_type;
                        var city = this.city;
                        var state = this.state;
                        var antennaType = this.antenna_type;
                        var directionMagnetic = this.direction_magnetic;
                        var liveDate = this.live_date;
                        var liveStatus = this.live_status;
                        var networkLogo = this.network_logo;
                        var x = {
                            band: band, psip_channel: psipChannel, rf_channel: rfChannel, live_status: liveStatus, live_date: liveDate, network_logo: networkLogo, direction_magnetic: directionMagnetic,
                            antenna_type: antennaType, state: state, city: city, call_sign: callSign, color: color, channel: channel, network: network, direction_true: directionTrue,
                            distance: distance, signal_strength: signalStrength, broadcast_type: broadcastType, station_id: stationId
                        };
                        awr.push(x);
                    });

                    currentAddress.antennawebResults = awr;
                    Render(updateBounds);

                    $("#loading").fadeOut();

                },
                error: function (msg) {
                    // TODO: alert the user somehow
                    $("#loading").fadeOut();

                    console.log(jqXHR);
                    console.log(textStatus);
                    console.log(errorThrown);
                }
            };

            $.ajax(serviceCall);
        }
