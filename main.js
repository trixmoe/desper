function Slide(div, timeout) {
    this.div = div
    this.timeout = timeout
    this.nmbVideos = undefined;
    this.nmbVideosEnded = 0;
}

const containerId = "display-container";

function createSlide(slideJson) {
    const newContainer = document.createElement("div");
    newContainer.id = containerId;

    for (url of slideJson.urls) {
        console.log("Content:", url)
        elem = mapURLToElement(url);
        newContainer.appendChild(elem);
    }

    var timeout = slideJson.timeout;

    return new Slide(newContainer, timeout);
}

const contentFile = (window.location.hash.slice(1) || "content") + ".json";

var firstLoadedChange = undefined;
var lastChange;
var slides;
var currentlyDisplayedSlide;
var defaultTimeout = 30;
var sliderTimer;
var fetchTimer;

function mapURLToElement(content) {
    switch(true) {
        case content.endsWith(".mp4"):
        case content.endsWith(".webm"):
            const vid = document.createElement("video");
            vid.src = content;
            vid.className = "content";
            vid.autoplay = false;
            vid.preload = "auto";
            vid.loop = false;
            vid.controls = false;
            return vid;
        case content.endsWith(".jpg"):
        case content.endsWith(".png"):
        case content.endsWith(".svg"):
        case content.endsWith(".gif"):
            const img = document.createElement("img");
            img.src = content;
            img.className = "content";
            img.loading = "eager";
            return img;
        default:
            throw new Error("Unknown content: ", content);
    }
}

function parseSlidesJson(json) {
    let newSlides = [];
    for (slideJson of json.slides) {
        console.log(slideJson);
        newSlides.push(createSlide(slideJson));
    }
    slides = newSlides;
    currentlyDisplayedSlide = undefined;
}

function nextSlide() {
    if(currentlyDisplayedSlide == undefined) currentlyDisplayedSlide = -1;
    var newSlideId = currentlyDisplayedSlide+1;
    if(newSlideId >= slides.length) newSlideId = 0;

    const oldContainer = document.getElementById(containerId);
    for (elem of oldContainer.children) {
        if(elem.tagName === "VIDEO") {
            elem.onended = null;
            elem.pause();
            elem.currentTime = 0;
        }
    }

    const newSlide = slides[newSlideId];
    newSlide.nmbVideos = 0;
    newSlide.nmbVideosEnded = 0;
    const newSlideContainer = newSlide.div;
    var timeout = newSlide.timeout;
    var switchSlideOnVideoEnd;
    for (elem of newSlideContainer.children) {
        if(elem.tagName === "VIDEO") {
            newSlide.nmbVideos = newSlide.nmbVideos+1;
            if(timeout != -1) {
                switchSlideOnVideoEnd = true;
                // If looping is enabled, onended will not work.
                elem.onended = bind_leading_args(videoEnded, elem, newSlideId);
                elem.loop = false;
            } else {
                elem.loop = true;
            }
            elem.play();
        }
    }

    oldContainer.replaceWith(newSlideContainer);
    currentlyDisplayedSlide = newSlideId;

    if(timeout == -1) {
        console.log("[Slide " + newSlideId + "] Timeout disabled, slide will not advance.");
        return;
    }

    var noTimeoutSpecified = timeout == 0 || timeout == undefined;
    if(noTimeoutSpecified) {
        if(switchSlideOnVideoEnd) {
            console.log("[Slide " + newSlideId + "] No timeout, relying on video ending.");
            return;
        } else timeout = defaultTimeout;
    }

    console.log("[Slide " + newSlideId + "] Next slide in ", timeout);
    sliderTimer = setTimeout(nextSlide, timeout * 1000);
}

// Fear of race condition, switching two slides at once.
// Unsure if this is reasonable, but easy fix/protection.
// https://stackoverflow.com/a/27699684
function bind_leading_args(fn, ...bound_args) {
    return function(...args) {
        return fn(...bound_args, ...args);
    };
}
// ------------------------------------

function videoEnded(vid, endedOnSlide, event) {
    var currentSlide = slides[currentlyDisplayedSlide];
    if(endedOnSlide != currentlyDisplayedSlide) {
        console.log("[Slide " + currentlyDisplayedSlide + "] ERROR: We already skipped slide " + endedOnSlide);
        return;
    } else {
        currentSlide.nmbVideosEnded = currentSlide.nmbVideosEnded+1;
    }

    console.log("[Slide " + currentlyDisplayedSlide + "] Video ended, on slide", endedOnSlide);

    if(currentSlide.nmbVideosEnded == currentSlide.nmbVideos) {
        console.log("[Slide " + currentlyDisplayedSlide + "] All videos ended. Switching from slide " + currentlyDisplayedSlide + ".");
        nextSlide();
    } else {
        // Keep playing the video, as it's not the last one.
        vid.loop = true;
        vid.play();
        vid.onended = null;
    }
}

function resetData() {
    lastChange = undefined;
    slides = undefined;
    currentlyDisplayedSlide = undefined;
    defaultTimeout = 30;
    if (sliderTimer != undefined) clearTimeout(sliderTimer);
    sliderTimer = undefined;
}

function fetchAndUpdate() {
    fetch(contentFile, {cache: 'no-store'})
        .then(out => out.json())
        .then(json => {
            console.log("Parsed elements: ", json);
            console.log(lastChange, json.lastChange)
            if(lastChange != json.lastChange) {
                resetData();
                lastChange = json.lastChange;

                if(firstLoadedChange == undefined)
                    firstLoadedChange = json.lastChange;

                console.log("last ", lastChange, " first", firstLoadedChange, " force page reload ", json.forcePageReload)
                if(lastChange != firstLoadedChange && json.forcePageReload == true) {
                    console.log("last ", lastChange, " first", firstLoadedChange)
                    location.reload();
                }

                try {
                    if(json.defaultTimeout != undefined)
                        defaultTimeout = json.defaultTimeout
                } catch {}
                parseSlidesJson(json);
                nextSlide();
            }
        });
    fetchTimer = setTimeout(fetchAndUpdate, 10 * 1000);
}

fetchAndUpdate();