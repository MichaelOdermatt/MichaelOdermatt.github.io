---
layout: page
title: Wave Generator 
---

<h3>Wave Shape</h3>
<p>Uses Gerstner Waves and a layered noise map, or 'Fractal Brownian Motion' to create the wave shape.
<br></p>

<img src="https://github.com/MichaelOdermatt/WaveGenerator/blob/main/Assets/Screenshots/Gerstner%20wave.png?raw=true" alt="Wave Image" width="600"/>
<img src="https://github.com/MichaelOdermatt/WaveGenerator/blob/main/Assets/Screenshots/Gerstner%20wave%202.PNG?raw=true" alt="Wave Image" width="600"/>

<img src="https://github.com/MichaelOdermatt/WaveGenerator/blob/main/Assets/Screenshots/Gerstner%20wave%203.PNG?raw=true" alt="Wave Image" width="600"/>
<img src="https://github.com/MichaelOdermatt/WaveGenerator/blob/main/Assets/Screenshots/Gerstner%20wave%204.PNG?raw=true" alt="Wave Image" width="600"/>

<h3>Whitecaps</h3>
<p>In order to assign colors to the vertices of the wave, I multiply a component of the angle from each surface normal by the corresponding vertex height. This gives me a decimal value that I can evaluate along a gradient to pick the right intensity of color. Once this process is done on all verticies, the wave is smoothly colored and, in my opinion, looks quite nice. 
<br></p>

![Wave Gif](https://media.giphy.com/media/lWS8ySFPFM3acEyFKE/giphy.gif)

<h3>Links</h3>

This **[Video](https://www.youtube.com/watch?v=MRNFcywkUSA&ab_channel=SebastianLague) and this **[Article](https://catlikecoding.com/unity/tutorials/flow/waves/) were very helpful in making this.

*View the code on [Github](https://github.com/MichaelOdermatt/WaveGenerator)*