(function () {
    const request = require('request');
    const google_kg_url = "https://kgsearch.googleapis.com/v1/entities:search?";
    const config = require('../config.js');
    const api_key = config.google_api_key;
    var mm = require('musicmetadata');
    const fs = require('fs');
    var l = require("lyric-get");


    angular.module('app')
        .service('knowledgeService', ['$q', KnowledgeService]);

    function KnowledgeService($q) {
        return {
            getResults: getResults,
            getId3Tags: getId3Tags,
            isFile: isFile,
            getYoutubeResults: getYoutubeResults,
            getMusixMatchResults: getMusixMatchResults,
            getLyrics: getLyrics
        }

        function getResults(query) {
            var deferred = $q.defer();
            request(
                google_kg_url + 'key=' + api_key + "&query=" + query + "&limit=10&indent=true",
                function (err, response, body) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log(response);
                    if (response.statusCode == 200) {
                        var body = JSON.parse(body);
                        if (body.itemListElement.length > 0)
                            deferred.resolve({
                                success: true,
                                results: body.itemListElement
                            });
                        else
                            deferred.reject({
                                success: false,
                                results: "Can't find anything matching that file/folder...yet"
                            });
                    } else {
                        deferred.reject({
                            success: false,
                            message: response.statusMessage
                        });
                    }
                });

            return deferred.promise;
        }

        function getMusixMatchResults(track, artist = "") {
            var deferred = $q.defer();

            var options = {
                method: 'GET',
                url: 'https://musixmatchcom-musixmatch.p.mashape.com/wsr/1.1/track.search',
                qs: {
                    q_track: track,
                    s_track_rating: 'desc',
                    q_artist: artist
                },
                headers: {
                    'x-mashape-key': config.mashape_api_key
                }
            };

            request(options, function (error, response, body) {
                if (error)
                    deferred.reject(error);
                else
                    deferred.resolve(JSON.parse(body));
            });

            return deferred.promise;
        }

        //Not legal technically....
        // TODO: Change this to a legal lone
        function getLyrics(track, artist) {
            var deferred = $q.defer();
            l.get(artist, track, function (err, res) {
                if (err) {
                    
                    deferred.reject(err);
                } else {
                    deferred.resolve(res);
                }
            });

            return deferred.promise;
        }

        function getYoutubeResults(query) {
            var deferred = $q.defer();
            request(
                "https://www.googleapis.com/youtube/v3/search?part=id&maxResults=10&order=viewCount&q=" + query + "&type=video&key=" + api_key,
                function (err, response, body) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    if (response.statusCode == 200) {
                        var body = JSON.parse(body);
                        console.log(body);
                        deferred.resolve({
                            success: true,
                            results: body.items
                        })
                    } else {
                        deferred.reject({
                            success: false,
                            message: response.statusMessage
                        });
                    }
                });

            return deferred.promise;
        }

        function getId3Tags(path) {
            var deferred = $q.defer();
            console.log(path);
            mm(fs.createReadStream(path), function (err, tags) {
                if (err)
                    deferred.reject(err)
                else
                    deferred.resolve(tags)
            })

            return deferred.promise;
        }

        function isFile(path) {
            var deferred = $q.defer();

            fs.stat(path, function (err, stats) {
                if (err)
                    deferred.reject(err);
                else
                    deferred.resolve(stats.isFile());
            })

            return deferred.promise;
        }

    }
})();