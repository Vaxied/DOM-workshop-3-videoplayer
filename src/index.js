;(function () {
    // Grabbing elements
    const videoContainer = document.querySelector('#video-container')
    const video = document.querySelector('#video-player')
    const resumePauseBtn = document.querySelector('#resumePause')
    const muteBtn = document.querySelector('#mute')
    const slider = document.querySelector('#slider-range')
    const managePlaybackBtn = document.querySelector('.manage-playback-button')
    const timeSlider = document.querySelector('#time-slider')
    const timeCounter = document.querySelector('.current-time')
    const timeDuration = document.querySelector('.video-duration')
    const controlsContainer = document.querySelector('.controls-container')
    const playbackRateSettings = document.querySelector(
        '.playback-rate-container'
    )
    const body = document.querySelector('body')
    const fullscreenBtn = document.querySelector('.fullscreen')

    let stopListening = true
    let intervalStarted = false
    let interval
    let coordinates
    let newCoordinates
    let seconds = 0

    console.log(video)

    let videoCurrent = video.currentTime
    let videoPrevState = ''
    let videoPrevVolume = ''
    let flag = 0

    // default video settings
    video.volume = 0.2
    muteVideo()
    const playPromise = video.play()
    video.disablePictureInPicture = true

    if (playPromise != undefined) {
        playPromise
            .then(() => {
                advanceVideoProgressBar()
                addAllEventListeners()
            })
            .catch((err) => {
                throw new Error(err)
            })
    }

    function addAllEventListeners() {
        document.addEventListener('fullscreenchange', exitHandler)
        document.addEventListener('webkitfullscreenchange', exitHandler)
        document.addEventListener('mozfullscreenchange', exitHandler)
        document.addEventListener('MSFullscreenChange', exitHandler)

        // container listeners
        videoContainer.addEventListener('mouseenter', showVideoControls)
        videoContainer.addEventListener('mouseleave', hideVideoControls)

        // video listeners
        video.addEventListener('dblclick', toggleFullscreen)
        video.addEventListener('click', resumePause)
        video.addEventListener('timeupdate', advanceVideoProgressBar)
        video.addEventListener('mousemove', getCoordinates)
        video.addEventListener('mousemove', setModeToActive)
        video.addEventListener('mouseenter', startListeningInterval)
        video.addEventListener('mouseleave', clearListeningInterval)

        // Time slider
        timeSlider.addEventListener('input', updateVideoTimer)
        timeSlider.addEventListener('input', updateProgressBarBackground)
        timeSlider.addEventListener('mousedown', pauseVideo)
        timeSlider.addEventListener('mouseup', setToPreviousState)

        // Volume slider
        slider.addEventListener('input', updateVolumeBar)

        // button listeners
        resumePauseBtn.addEventListener('click', resumePause)
        muteBtn.addEventListener('click', muteVideo)
        managePlaybackBtn.addEventListener('click', showPlaybackSettings)
        fullscreenBtn.addEventListener('click', toggleFullscreen)

        // Playback settings
        playbackRateSettings.addEventListener('click', setPlaybackRate)

        // Body listener
        body.addEventListener('click', closeSettings)
        body.addEventListener('keyup', handleKeyboardEvents)
    }

    function showVideoControls() {
        if (!playbackRateSettings.classList.contains('hidden')) return

        if (!controlsContainer.classList.contains('hidden')) {
            return
        }
        controlsContainer.classList.remove('hidden')
    }

    function hideVideoControls() {
        if (video.paused) return

        if (!playbackRateSettings.classList.contains('hidden')) return

        if (controlsContainer.classList.contains('hidden')) return

        controlsContainer.classList.add('hidden')
    }

    function shouldControlsStopListening() {
        if (controlsContainer.classList.contains('hidden')) return false
        else return true
    }

    function getCoordinates() {
        coordinates = [event.x, event.y].toString()
    }

    function setModeToActive() {
        showVideoControls()
        video.style.cursor = 'auto'
    }

    function startListeningInterval() {
        let lastCoordinates = coordinates
        interval = setInterval(() => {
            newCoordinates = coordinates
            if (
                controlsContainer.classList.contains('hidden') ||
                video.paused
            ) {
                return
            }
            if (lastCoordinates === newCoordinates) {
                seconds++
                if (seconds === 3) {
                    hideVideoControls()
                    video.style.cursor = 'none'
                    console.log('Controls were hidden due to inactivity')
                    seconds = 0
                }
            } else {
                lastCoordinates = newCoordinates
                seconds = 0
                console.log('mouse is active, resetting counter')
            }
        }, 1000)
    }

    function clearListeningInterval() {
        clearInterval(interval)
        interval = undefined
    }

    function resumePause() {
        if (areSettingsOpened()) return

        saveVideoState()
        if (video.paused) {
            playVideo()
        } else pauseVideo()
    }

    //SET AN INACTIVITY TIMER THAT FADES OUT THE VIDEO CONTROLS
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            fullscreenPromise = document
                .querySelector('.main-container')
                .requestFullscreen()

            if (fullscreenPromise != undefined) {
                fullscreenPromise
                    .then(() => {
                        maximizeVideoContainer()
                    })
                    .catch((err) => {
                        throw new Error(err)
                    })
            }
        } else if (document.exitFullscreen) {
            minimizeVideoContainer()
            document.exitFullscreen()
            console.log('exited fullscreen')
        }
    }

    function exitHandler() {
        if (
            !document.fullscreenElement &&
            !document.webkitIsFullScreen &&
            !document.mozFullScreen &&
            !document.msFullscreenElement
        ) {
            minimizeVideoContainer()
        }
    }

    function maximizeVideoContainer() {
        videoContainer.style.width = 100 + '%'
        videoContainer.style.maxWidth = 100 + '%'
    }

    function minimizeVideoContainer() {
        videoContainer.style.maxWidth = '60rem'
    }

    function saveVideoState() {
        if (video.paused === true) videoPrevState = 'paused'
        else videoPrevState = 'playing'
        return videoPrevState
    }

    function setToPreviousState() {
        if (videoPrevState === 'playing') playVideo()
        else pauseVideo()
    }

    function pauseVideo() {
        saveVideoState()
        video.pause()
        resumePauseBtn.firstElementChild.src = './assets/imgs/play-solid.svg'
        showVideoControls()
    }

    function playVideo(event) {
        saveVideoState()
        video.play()
        resumePauseBtn.firstElementChild.src = './assets/imgs/pause-solid.svg'
    }

    function muteVideo() {
        if (video.muted || video.volume == 0) {
            console.log('no longer muted')
            video.muted = false
            video.volume = videoPrevVolume
            slider.value = video.volume * 100
            muteBtn.firstElementChild.src = './assets/imgs/sound-high.svg'
        } else {
            saveVideoVolume()
            console.log('video has been muted')
            video.muted = true
            video.volume = 0
            slider.value = 0
            muteBtn.firstElementChild.src = './assets/imgs/sound-off.svg'
        }
        updateVolumeBar()
    }

    function saveVideoVolume() {
        return (videoPrevVolume = video.volume)
    }

    function updateVideoVolume() {
        video.volume = slider.value / 100
    }

    function updateVolumeBar() {
        updateVideoVolume()
        if (video.volume === 0) {
            muteBtn.firstElementChild.src = './assets/imgs/sound-off.svg'
            video.muted = true
        } else {
            muteBtn.firstElementChild.src = './assets/imgs/sound-high.svg'
            video.muted = false
        }
        updateVolumeBarBackground()
    }

    function showPlaybackSettings() {
        event.stopPropagation()
        if (playbackRateSettings.classList.contains('hidden')) {
            playbackRateSettings.classList.remove('hidden')
        } else playbackRateSettings.classList.add('hidden')
    }

    function setPlaybackRate(event) {
        if (event.target.classList.contains('playback-rate-btn')) {
            if (event.target.textContent === 'Normal') {
                video.playbackRate = 1.0
            } else {
                video.playbackRate = event.target.textContent.slice(0, -1)
            }
        }
    }

    function closeSettings(event) {
        if (event.target.classList.contains('playback-rate-btn')) return
        else if (
            event.target.classList.contains('main-container') &&
            !video.paused
        ) {
            controlsContainer.classList.add('hidden')
            playbackRateSettings.classList.add('hidden')
            return
        } else {
            playbackRateSettings.classList.add('hidden')
        }
    }

    function areSettingsOpened() {
        if (!playbackRateSettings.classList.contains('hidden')) return true
        else return false
    }

    function updateVideoTimer() {
        video.currentTime = (timeSlider.value * video.duration) / 100
        console.log(video.currentTime)
        videoCurrent = secondsToTime(video.currentTime)
        setTimerCounter(videoCurrent)
    }

    function advanceVideoProgressBar() {
        if (video.ended) {
            console.log('video has ended')
            pauseVideo()
            return
        }

        if (video.paused) return

        updateProgressBarValue()
        updateProgressBarBackground()
        videoCurrent = secondsToTime(video.currentTime)
        timeDuration.textContent = secondsToTime(video.duration)
        console.log(videoCurrent)
        console.log(video.currentTime)
        setTimerCounter(videoCurrent)
    }

    function secondsToTime(timeInSeconds) {
        const h = Math.floor(timeInSeconds / 3600)
                .toString()
                .padStart(2, '0'),
            m = Math.floor((timeInSeconds % 3600) / 60)
                .toString()
                .padStart(2, '0'),
            s = Math.floor(timeInSeconds % 60)
                .toString()
                .padStart(2, '0')
        if (h > 1) return `${h}:${m}:${s}`
        else m > 1
        return `${m}:${s}`
    }

    function setTimerCounter(currentTime) {
        timeCounter.textContent = `${currentTime}`
    }

    function updateProgressBarValue() {
        timeSlider.value = (video.currentTime / video.duration) * 100
        console.log(timeSlider.value)
    }

    function hideAfterThreeSeconds(event) {
        if (typeof interval != 'number') {
            setTimeout(() => {
                hideVideoControls()
            }, 3000)
        } else seconds = 0
    }

    function handleKeyboardEvents(event) {
        console.log(event.key)
        if (event.defaultPrevented) return
        // event.preventDefault()

        switch (event.key) {
            case 'ArrowLeft':
                video.currentTime = video.currentTime - 5
                showVideoControls()
                updateProgressBarValue()
                updateProgressBarBackground()
                updateVideoTimer()
                hideAfterThreeSeconds(event)
                break
            case 'ArrowRight':
                video.currentTime = video.currentTime + 5
                showVideoControls()
                updateProgressBarValue()
                updateProgressBarBackground()
                updateVideoTimer()
                hideAfterThreeSeconds(event)
                break
            case ' ':
                resumePause()
                if (!video.paused) hideAfterThreeSeconds(event)
                break
            case 'ArrowUp':
                if (video.volume === 1.0) return

                if (video.volume + 0.05 > 1.0) {
                    video.volume = 1.0
                    return
                }
                if (video.muted) {
                    video.muted = false
                }
                video.volume += 0.05
                slider.value = video.volume * 100
                updateVolumeBar()
                break
            case 'ArrowDown':
                if (video.volume === 0) return

                if (video.volume - 0.05 < 0) {
                    video.volume = 0
                    video.muted = true
                    return
                } else {
                    video.volume -= 0.05
                }
                slider.value = video.volume * 100
                updateVolumeBar()
                break
        }
        event.preventDefault()
    }

    function updateProgressBarBackground() {
        updateTrackBackground(timeSlider)
    }

    function updateVolumeBarBackground() {
        updateTrackBackground(slider)
    }

    function updateTrackBackground(slider) {
        let value =
            ((slider.value - slider.min) / (slider.max - slider.min)) * 100
        slider.style.background = `linear-gradient(to right, #07b4d7 0%, #07b4d7 ${value}%, #d3d3d3 ${value}%, #d3d3d3 100%)`
    }
})()
