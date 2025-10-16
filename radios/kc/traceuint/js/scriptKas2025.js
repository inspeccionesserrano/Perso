const RADIO_NAME = 'Radio Fola';

// Change Stream URL Here, Supports, ICECAST, ZENO, SHOUTCAST, RADIOJAR and any other stream service.
const URL_STREAMING = 'https://stream.zeno.fm/emertvc73mruv';

// Puedes encontrar el punto de montaje en la Configuración de transmisión.
// Para generar el enlace API de Zeno Radio desde el punto de montaje,
// excluimos la parte '/source' y agregamos el punto de montaje restante a la URL base de la API.
// Por ejemplo, si el punto de montaje es 'yn65fsaurfhvv/source',
// el enlace API será 'https://api.zeno.fm/mounts/metadata/subscribe/yn65fsaurfhvv'.

const url = 'https://api.zeno.fm/mounts/metadata/subscribe/emertvc73mruv';

// Visit https://api.vagalume.com.br/docs/ to get your API key
const API_KEY = "722084e5ad8a078f47728ba92c01162e";

// Variable to control history display: true = display / false = hides
let showHistory = false; 

window.onload = function () {
    var page = new Page;
    page.changeTitlePage();
    page.setVolume();

    var player = new Player();
    player.play();

    getStreamingData();
    // Interval to get streaming data in miliseconds
    setInterval(function () {
        getStreamingData();
    }, 10000);

    var coverArt = document.getElementsByClassName('cover-album')[0];

    coverArt.style.height = coverArt.offsetWidth + 'px';

    localStorage.removeItem('musicHistory');
}

// DOM control
class Page {
    constructor() {
        this.changeTitlePage = function (title = RADIO_NAME) {
            document.title = title;
        };

        this.refreshCurrentSong = function (song, artist) {
            var currentSong = document.getElementById('currentSong');
            var currentArtist = document.getElementById('currentArtist');

            if (song !== currentSong.innerHTML) {
                // Animate transition
                currentSong.className = ' text-uppercase';
                currentSong.innerHTML = song;

                currentArtist.className = ' text-capitalize';
                currentArtist.innerHTML = artist;

                // Refresh modal title
                document.getElementById('lyricsSong').innerHTML = song + ' - ' + artist;

                // Remove animation classes
                setTimeout(function () {
                    currentSong.className = 'text-uppercase';
                    currentArtist.className = 'text-capitalize';
                }, 2000);
            }
        };

        // Función para actualizar la portada.
        this.refreshCover = function (song = '', artist) {
            // Default cover art
            var urlCoverArt = 'img/cover.png';

            // Creación de la etiqueta script para realizar la solicitud JSONP a la API de Deezer
            const script = document.createElement('script');
            script.src = `https://api.deezer.com/search?q=${artist} ${song}&output=jsonp&callback=handleDeezerResponse`;
            document.body.appendChild(script);
        };


        this.refreshLyric = function (currentSong, currentArtist) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState === 4 && this.status === 200) {
                    var data = JSON.parse(this.responseText);

                    var openLyric = document.getElementsByClassName('lyrics')[0];

                    if (data.type === 'exact' || data.type === 'aprox') {
                        var lyric = data.mus[0].text;

                        document.getElementById('lyric').innerHTML = lyric.replace(/\n/g, '<br />');
                        openLyric.style.opacity = "1";
                        openLyric.setAttribute('data-toggle', 'modal');
                    } else {
                        openLyric.style.opacity = "0.3";
                        openLyric.removeAttribute('data-toggle');

                        var modalLyric = document.getElementById('modalLyrics');
                        modalLyric.style.display = "none";
                        modalLyric.setAttribute('aria-hidden', 'true');
                        (document.getElementsByClassName('modal-backdrop')[0]) ? document.getElementsByClassName('modal-backdrop')[0].remove() : '';
                    }
                } else {
                    document.getElementsByClassName('lyrics')[0].style.opacity = "0.3";
                    document.getElementsByClassName('lyrics')[0].removeAttribute('data-toggle');
                }
            };
            xhttp.open('GET', 'https://api.vagalume.com.br/search.php?apikey=' + API_KEY + '&art=' + currentArtist + '&mus=' + currentSong.toLowerCase(), true);
            xhttp.send();
        };
    }
}

// Variable global para almacenar las canciones.
var audio = new Audio(URL_STREAMING);
// Función para manejar el cableado de eventos.
function connectToEventSource(url) {
    // Cree una nueva instancia de EventSource con la URL proporcionada
    const eventSource = new EventSource(url);

    // Agregar un oyente para el evento 'mensaje'
    eventSource.addEventListener('message', function(event) {
        // Llame a la función para procesar los datos recibidos, pasando también la URL
        processData(event.data, url);
    });

    // Agregue un oyente para el evento 'error'
    eventSource.addEventListener('error', function(event) {
        console.error('Erro na conexão de eventos:', event);
        // Intente volver a conectarse después de un retraso de tiempo
        setTimeout(function() {
            connectToEventSource(url);
        }, 1000);
    });
}

// Función para procesar los datos recibidos.
function processData(data) {
    // Parse JSON
    const parsedData = JSON.parse(data);
    
    // Comprueba si el mensaje es sobre la canción.
    if (parsedData.streamTitle) {
        // Extraer título de canción y artista.
        let artist, song;
        const streamTitle = parsedData.streamTitle;

        if (streamTitle.includes('-')) {
            [artist, song] = streamTitle.split(' - ');
        } else {
            // Si no hay "-" en la cadena, consideramos que el título es solo el nombre de la canción.
            artist = '';
            song = streamTitle;
        }

        // Crea el objeto con los datos formateados.
        const formattedData = {
            currentSong: song.trim(),
            currentArtist: artist.trim()
        };

        // Convertir el objeto a JSON
        const jsonData = JSON.stringify(formattedData);

        // Llame a la función getStreamingData con los datos formateados y la URL
        getStreamingData(jsonData);
    } else {
        console.log('Mensagem recebida:', parsedData);
    }
}

// Comience a conectarse a la API
connectToEventSource(url);

// Define la función de manejo de respuestas de la API de Deezer en el ámbito global.
function handleDeezerResponse(data, song) {
    var coverArt = document.getElementById('currentCoverArt');
    var coverBackground = document.getElementById('bgCover');

    if (data.data && data.data.length > 0) {
        // Buscar portada por nombre de artista
         // var ArtworkUrl = data.data[0].artist.picture_big;
         //Buscar portada por nombre de canción
        var artworkUrl = data.data[0].album.cover_big;

        coverArt.style.backgroundImage = 'url(' + artworkUrl + ')';
        coverArt.className = 'animated bounceInLeft';

        coverBackground.style.backgroundImage = 'url(' + artworkUrl + ')';
    } else {
        // Si no hay datos o la lista de datos está vacía,
         // establecer cobertura predeterminada
        var defaultArtworkUrl = 'img/cover.png';

        coverArt.style.backgroundImage = 'url(' + defaultArtworkUrl + ')';
        coverBackground.style.backgroundImage = 'url(' + defaultArtworkUrl + ')';
    }

    setTimeout(function () {
        coverArt.className = '';
    }, 2000);

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song,
            artist: data.data[0].artist.name,
            artwork: [{
                    src: artworkUrl || defaultArtworkUrl,
                    sizes: '96x96',
                    type: 'image/png'
                },
                {
                    src: artworkUrl || defaultArtworkUrl,
                    sizes: '128x128',
                    type: 'image/png'
                },
                {
                    src: artworkUrl || defaultArtworkUrl,
                    sizes: '192x192',
                    type: 'image/png'
                },
                {
                    src: artworkUrl || defaultArtworkUrl,
                    sizes: '256x256',
                    type: 'image/png'
                },
                {
                    src: artworkUrl || defaultArtworkUrl,
                    sizes: '384x384',
                    type: 'image/png'
                },
                {
                    src: artworkUrl || defaultArtworkUrl,
                    sizes: '512x512',
                    type: 'image/png'
                }
            ]
        });
    }
}

function getStreamingData(data) {

    console.log("Conteúdo dos dados recebidos:", data);
    // Parse JSON
    var jsonData = JSON.parse(data);

    var page = new Page();

    // Formatar caracteres para UTF-8
    let song = jsonData.currentSong.replace(/&apos;/g, '\'').replace(/&amp;/g, '&');
    let artist = jsonData.currentArtist.replace(/&apos;/g, '\'').replace(/&amp;/g, '&');

    // Mudar o título
    document.title = song + ' - ' + artist + ' | ' + RADIO_NAME;

    page.refreshCover(song, artist);
    page.refreshCurrentSong(song, artist);
    page.refreshLyric(song, artist);

    if (showHistory) {

        // Verificar se a música é diferente da última atualizada
        if (musicHistory.length === 0 || (musicHistory[0].song !== song)) {
            // Atualizar o histórico com a nova música
            updateMusicHistory(artist, song);
        }

        // Atualizar a interface do histórico
        updateHistoryUI();

    }
}

