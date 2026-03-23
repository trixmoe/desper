function Slide(div, timeout) {
    this.div = div
    this.timeout = timeout
}

const id = "display-container";

function createSlide(slideJson) {
    const newContainer = document.createElement("div");
    newContainer.id = id;

    for (url of slideJson.urls) {
        console.log("Content:", url)
        elem = mapURLToElement(url);
        newContainer.appendChild(elem);
    }

    var timeout = 0
    try {timeout = slideJson.timeout} catch {}

    return new Slide(newContainer, timeout);
}

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
            vid.loop = true;
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

    const oldContainer = document.getElementById(id);
    for (elem of oldContainer.children) {
        if(elem.tagName === "VIDEO") {
            elem.pause();
            elem.currentTime = 0;
        }
    }

    const newSlide = slides[newSlideId];
    const newContainer = newSlide.div;
    for (elem of newContainer.children) {
        if(elem.tagName === "VIDEO") {
            elem.play();
        }
    }

    oldContainer.replaceWith(newContainer);
    currentlyDisplayedSlide = newSlideId;

    var timeout = newSlide.timeout;
    if(timeout == 0 || timeout == undefined) timeout = defaultTimeout;
    console.log("Next slide in ", timeout);
    sliderTimer = setTimeout(nextSlide, timeout * 1000);
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
    fetch("content.json", {cache: 'no-store'})
        .then(out => out.json())
        .then(json => {
            console.log("Parsed elements: ", json);
            console.log(lastChange, json.lastChange)
            if(lastChange != json.lastChange) {
                resetData();
                lastChange = json.lastChange;
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