var currentPlaylist = [];
var shufflePlaylist = [];
var tempPlaylist = [];
var audioElement;
var mouseDown = false;
var currentIndex = 0;
var repeat = false;
var shuffle = false;
var userLoggedIn;
var timer;

$(document).on("change", "select.playlist", function() {
    var select = $(this);
    //this will contain the value of the playlsit
    var playlistId = select.val();
    //this will contain the value of the song
    var songId = select.prev(".songId").val();

    $.post("includes/handlers/ajax/addToPlaylist.php", { playlistId: playlistId, songId: songId}).done(function(error) {
        
        if(error != "") {
            alert(error);
            return;
        }

        hideOptionsMenu();
        select.val("");
    });
});

function removeFromPlaylist(button, playlistId) {
    var songId = $(button).prevAll(".songId").val();

    $.post("includes/handlers/ajax/removeFromPlaylist.php", {playlistId: playlistId, songId: songId}).done(function(error) {
        //do something when ajax returns
        if(error != "") {
            alert(error);
            return;
        }
        openPage("playlist.php?id=" + playlistId);
    });
}

function openPage(url) {

    if(timer != null) {
        clearTimeout(timer);
    }

    if (url.indexOf("?") == -1) {
        url = url + "?";
    }
    var encodedUrl = encodeURI(url + "&userLoggedIn=" + userLoggedIn);
    $("#mainContent").load(encodedUrl);
    $("body").scrollTop(0);
    //puts the url in the url bar
    history.pushState(null, null, url);
}

function formatTime(seconds) {
    var time = Math.round(seconds);
    var minutes = Math.floor(time / 60);
    var seconds = time - (minutes * 60);

    var extraZero;

    if(seconds < 10) {
        extraZero = "0";
    } else {
        extraZero = "";
    }

    return minutes + ":" + extraZero + seconds;
}

function updateTimeProgressBar(audio) {
    $(".progressTime.current").text(formatTime(audio.currentTime));
    $(".progressTime.remaining").text(formatTime(audio.duration - audio.currentTime));

    var progress = audio.currentTime / audio.duration * 100;
    $(".playbackBar .progress").css("width", progress + "%");
}

function updateVolumeProgressBar(audio) {
    var volume = audio.volume * 100;
    $(".volumeBar .progress").css("width", volume + "%");
}

function Audio() {
    this.currentlyPlaying;
    this.audio = document.createElement('audio');

    this.audio.addEventListener("ended", function() {
        nextSong();
    });

    this.audio.addEventListener("canplay", function() {
        var duration = formatTime(this.duration);
        $(".progressTime.remaining").text(duration);
    });

    this.audio.addEventListener("timeupdate", function() {
        if(this.duration) {
            updateTimeProgressBar(this);
        }
    });

    this.audio.addEventListener("volumechange", function() {
        updateVolumeProgressBar(this);
    });

    this.setTrack = function(track) {
        this.currentlyPlaying = track;
        this.audio.src = track.path;
    }

    this.play = function() {
        this.audio.play();
    }

    this.pause = function() {
        this.audio.pause();
    }

    this.setTime = function(seconds) {
        this.audio.currentTime = seconds;
    }

}

function playFirstSong() {
    setTrack(tempPlaylist[0], tempPlaylist, true);
}

function createPlaylist() {
    var popup = prompt("Please enter the name of your playlist:");
    if(popup != null) {
        $.post("includes/handlers/ajax/createPlaylist.php", {name: popup, username: userLoggedIn}).done(function(error) {
            //do something when ajax returns
            if(error != "") {
                alert(error);
                return;
            }
            openPage("yourMusic.php");
        });
    }
} 

function deletePlaylist(playlistId) {
    var prompt = confirm("Are you sure you want to delete this playlist?");

    if(prompt) {
        $.post("includes/handlers/ajax/deletePlaylist.php", {playlistId: playlistId}).done(function(error) {
            //do something when ajax returns
            if(error != "") {
                alert(error);
                return;
            }
            openPage("yourMusic.php");
        });
    }
}

function hideOptionsMenu() {
    var menu = $(".optionsMenu");
    if(menu.css("display") != "none") {
        menu.css("display", "none");
    }
}

function showOptionsMenu(button) {

    var songId = $(button).prev(".songId").val();

    var menu = $(".optionsMenu");

    var menuWidth = menu.width();

    menu.find(".songId").val(songId);

    var scrollTop = $(window).scrollTop(); 
    //distance from top of window to the top of document
    var elementOffset = $(button).offset().top;
    //distance from top of the document

    var top = elementOffset - scrollTop;
    var left = $(button).position().left;


    menu.css({
        "top": top + "px",
        "left": left - menuWidth +"px",
        "display": "inline"
    });
}

function logout() {
    $.post("includes/handlers/ajax/logout.php", function() {
        location.reload();
    });
}

function updateEmail(emailClass) {
    var emailValue = $("." + emailClass).val();

    $.post("includes/handlers/ajax/updateEmail.php", {email: emailValue, username: userLoggedIn}).done(function (response) {
        $("." + emailClass).nextAll(".message").text(response);
    });
}

function updatePassword(oldPasswordClass, newPasswordClass1, newPasswordClass2) {
    var oldPassword = $("." + oldPasswordClass).val();
    var newPassword1 = $("." + newPasswordClass1).val();
    var newPassword2 = $("." + newPasswordClass2).val();

    $.post("includes/handlers/ajax/updatePassword.php", { 
        oldPassword: oldPassword,
        newPassword1: newPassword1,
        newPassword2: newPassword2,
        username: userLoggedIn }).done(function (response) {
        $("." + oldPasswordClass).nextAll(".message").text(response);
    });
}

function deleteUser(userId, term) {
    $.post("includes/handlers/ajax/deleteUser.php", {userId: userId}).done(function(error) {
        //do something when ajax returns
        if(error != "") {
            alert(error);
            return;
        }
        if(term == undefined) {
            term = "";
        }
        openPage("adminUsers.php?term=" + term);
    });
}

function updateUsers(idUserID, usernameID, firstNameID, lastNameID, emailID, passwordID, adminSelectID) {
    var term;
    var userId = $("#" + idUserID).val();
    var username = $("#" + usernameID).val();
    var firstName = $("#" + firstNameID).val();
    var lastName = $("#" + lastNameID).val();
    var email = $("#" + emailID).val();
    var password = $("#" + passwordID).val();
    var adminSelect = $("#" + adminSelectID).val();

    if(userId == "" || username == "" || firstName == "" || lastName == "" || email == "" || password == "") {
        alert("Please fill all the fields!");
        return;
    }

    $.post("includes/handlers/ajax/editUser.php", {userId: userId, username: username, firstName: firstName, lastName: lastName, email: email, password: password, adminSelect: adminSelect}).done(function(error) {
        //do something when ajax returns
        if(error != "") {
            alert(error);
            return;
        }
        if(term == undefined) {
            term = username;
            console.log(term);
        }
        openPage("adminUsers.php?term=" + term);
        alert("User added/Updated!");
    });
}

function updateGenre(idGenreID, nameID) {
    var term;
    var genreId = $("#" + idGenreID).val();
    var name = $("#" + nameID).val();

    if(genreId == "" || name == "") {
        alert("Please fill all the fields!");
        return;
    }

    $.post("includes/handlers/ajax/editGenre.php", {genreId: genreId, name: name}).done(function(error) {
        //do something when ajax returns
        if(error != "") {
            alert(error);
            return;
        }
        if(term == undefined) {
            term = name;
            console.log(term);
        }
        openPage("adminGenres.php?term=" + term);
        alert("Genre Added/Updated!");
    });
}

function deleteGenre(genreId, term) {
    $.post("includes/handlers/ajax/deleteGenre.php", {genreId: genreId}).done(function(error) {
        //do something when ajax returns
        if(error != "") {
            alert(error);
            return;
        }
        if(term == undefined) {
            term = "";
        }
        openPage("adminGenres.php?term=" + term);
    });
}

function deleteSong(songId, term) {
    $.post("includes/handlers/ajax/deleteSong.php", {songId: songId}).done(function(error) {
        //do something when ajax returns
        if(error != "") {
            alert(error);
            return;
        }
        if(term == undefined) {
            term = "";
        }
        openPage("adminSongs.php?term=" + term);
    });
}

function deleteAlbum(albumId, term) {
    $.post("includes/handlers/ajax/deleteAlbum.php", {albumId: albumId}).done(function(error) {
        //do something when ajax returns
        if(error != "") {
            alert(error);
            return;
        }
        if(term == undefined) {
            term = "";
        }
        openPage("adminAlbums.php?term=" + term);
    });
}

function deleteArtist(artistId, term) {
    $.post("includes/handlers/ajax/deleteArtist.php", {artistId: artistId}).done(function(error) {
        //do something when ajax returns
        if(error != "") {
            alert(error);
            return;
        }
        if(term == undefined) {
            term = "";
        }
        openPage("adminArtists.php?term=" + term);
    });
}

$(document).click(function(click) {
    var target = $(click.target);

    if(!target.hasClass("item") && !target.hasClass("optionsButton")) {
        hideOptionsMenu();
    };
});

$(window).scroll(function() {
    hideOptionsMenu();
});