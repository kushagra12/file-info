(function(){
    const remote = require('electron').remote;
    const file_path = remote.getGlobal('sharedObject').filename;
    const path = require('path');
    

    angular.module('app')
        .controller('knowledgeController', ['knowledgeService','$mdDialog', KnowledgeController])

    function KnowledgeController(knowledgeService, $mdDialog){
        var self = this;

        self.isFetching = true;
        self.fetchFailed = false;
        self.resultsFetched = false;
        self.result = {};
        self.errMessage = "";
        self.fetchResults = fetchResults;
        self.currentVideo = 0;
        self.videos = [];

        getDetails(file_path);


        function getDetails(f_path){
            knowledgeService
            .isFile(f_path)
            .then(function(isFile){
                if(isFile)
                    getFileDetails(f_path)
                else
                    fetchResults(path.basename(f_path))
            })
        }

        function getFileDetails(f_path){
            switch(path.extname(f_path)){
                case '.m4a':
                case '.mp3':
                case '.flac':
                    knowledgeService
                    .getId3Tags(f_path)
                    .then(function(tags){
                        console.log(tags);
                        var track = tags.title.replace(/ *\([^)]*\) */g, "");
                        fetchYoutubeVideo(track + tags.artist[0]);
                        fetchMusicDetails(track, tags.artist[0]);
                    })
            }
        }

        function fetchMusicDetails(trackName, artist){
            knowledgeService.getMusixMatchResults(trackName, artist).then(function(tracks){
                self.isFetching = false;
                var track = tracks[0];
                console.log(tracks);
                self.result = Object.assign({}, self.result, {
                    name: track.track_name,
                    type: "music",
                    album: track.album_name,
                    artist: track.artist_name,
                })
                if(track.primary_genres.music_genre.length > 0)
                    self.result.genre = track.primary_genres.music_genre[0].music_genre_name

                return knowledgeService.getLyrics(track.track_name, track.artist_name);
            }).then(function(lyrics_resp){
                self.result.lyrics = lyrics_resp
            }).catch(function(err){
                if(err == 'not found'){
                    self.result.lyrics = "No lyrics found"
                }
            });
        }

        function fetchYoutubeVideo(trackName){
            knowledgeService
            .getYoutubeResults(trackName)
            .then(function(response){
                self.isFetching = false;
                console.log(response);
                self.videos = response.results;
            }).catch(function(err){
                self.isFetching = false;
                console.log(err);
            });
        }
        function fetchResults(query){
            knowledgeService
            .getResults(query)
            .then(function(response){
                self.isFetching = false;
                if(response.success){
                    self.result = response.results[0].result;
                }
                else{
                    self.fetchFailed = true;
                    self.errMessage = response.message;
                }
            }).catch(function(err){
                self.isFetching = false;

            });
        }

    }
})();