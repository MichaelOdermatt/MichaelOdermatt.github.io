---
layout: page
title: Wave Generator 
---

<p align="center">
  <img src="https://media.giphy.com/media/lWS8ySFPFM3acEyFKE/giphy.gif" alt="Wave Gif" width="500"/>
</p>

<h3>How I made the wave shape</h3>
<p>For the basic wave shape I used something called <a href="https://en.wikipedia.org/wiki/Trochoidal_wave">Gerstner Waves</a>. Gerstner Waves by themselves create a pleasent looking wave but a little too clean for my taste. So for something more realistic I added a few layers of random noise.
<br></p>

<p align="center">
  <img src="https://github.com/MichaelOdermatt/WaveGenerator/blob/main/Assets/Screenshots/Gerstner%20wave.png?raw=true" alt="Wave Image" width="500" height="275"/>
  <img src="https://github.com/MichaelOdermatt/WaveGenerator/blob/main/Assets/Screenshots/Gerstner%20wave%202.PNG?raw=true" alt="Wave Image" width="500" height="275"/>
  <img src="https://github.com/MichaelOdermatt/WaveGenerator/blob/main/Assets/Screenshots/Gerstner%20wave%203.PNG?raw=true" alt="Wave Image" width="500" height="275"/>
  <img src="https://github.com/MichaelOdermatt/WaveGenerator/blob/main/Assets/Screenshots/Gerstner%20wave%204.PNG?raw=true" alt="Wave Image" width="500" height="275"/>
</p>

<h3>How I made the whitecaps</h3>
<p>In order to assign colors to the vertices of the wave, I multiply a component of the angle from each surface normal by the corresponding vertex height. This gives me a decimal value that I can evaluate along a gradient to pick the right intensity of color. Once this process is done on all verticies, the wave is smoothly colored and in my opinion looks quite nice. 
<br></p>

<h3>Links</h3>

This [Video](https://www.youtube.com/watch?v=MRNFcywkUSA&ab_channel=SebastianLague) and this [Article](https://catlikecoding.com/unity/tutorials/flow/waves/) were a huge help in making this!
