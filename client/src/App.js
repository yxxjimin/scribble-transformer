import './App.css';
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function App() {
  // Tools
  const tools = ["Rectangle", "Circle", "Brush", "Eraser"];

  // Refs
  const canvasRef = useRef(null);

  // States
  const [option, setOption] = useState("Brush");
  const [ctx, setCtx] = useState();
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasSize, setCanvasSize] = useState();
  const [generated, setGenerated] = useState({ text: "", src: "" });

  // Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    setCanvasSize({ width: canvas.width, height: canvas.height });

    const context = canvas.getContext("2d");
    context.strokeStyle = "black";
    context.lineWidth = 2.5;

    context.fillStyle = "#FFF";
    context.fillRect(0, 0, canvas.width, canvas.height);
  
    setCtx(context);
  }, []);

  // Event Handlers
  const startDraw = ({ nativeEvent }) => { 
    const { offsetX, offsetY } = nativeEvent;
    setIsDrawing(true);
    ctx.beginPath(); // Empty list of sub-paths
    ctx.moveTo(offsetX, offsetY); // Start sub-path
  };

  const finishDraw = () => { setIsDrawing(false); };

  const drawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    if (ctx && isDrawing) {
      ctx.lineTo(offsetX, offsetY); // Add to sub-path
      ctx.stroke(); // Draw path
    }
  };

  const clearCanvas = () => {
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
  };

  const saveImage = () => {
    setGenerated({ text: "Generating...", src: "" });
    
    let imgURL = canvasRef.current.toDataURL('image/png');
    const formData = new FormData();
    formData.append("img", imgURL);

    axios.post('http://localhost:5000/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    }).then((res) => {
      let dummy = {};
      dummy['text'] = res['data']['content'];
      dummy['src'] = res['data']['img'];
      console.log(dummy);
      
      return dummy;
    }).then((data) => setGenerated(data));
  };


  return (
    <div className="container">
      <p className="heading">Sketch-to-Image Generator</p>
      <div id="instream">
        <section className="menu">
          <div className="row">
            <label className="title">Tools</label>
            <ul className="options">
              {tools.map((tool) => (
                <li className={
                  (tool === option) ? "option selected" : "option"
                } key={tool} id={tool} 
                  onClick={() => setOption(tool)}>
                  <span>{tool}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="row">
            <label className="title">Size</label>
            <ul className="options">
              <li className="option">
                <input type="range" id="size-slider" min="1" max="30" value="5" 
                  onChange={() => {}}/>
              </li>
            </ul>
          </div>
          <div className="row colors">
            <label className="title">Colors</label>
            <ul className="options">
              <li className="option"></li>
              <li className="option selected"></li>
              <li className="option"></li>
              <li className="option"></li>
            </ul>
          </div>
          <div className="row buttons">
            <button 
              className="clear-btn" onClick={clearCanvas}>Clear Canvas</button>
            <button className="save-btn" onClick={saveImage}>Generate</button>
          </div>
        </section>
        <section className="board">
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseUp={finishDraw}
            onMouseMove={drawing}  
          ></canvas>
        </section>
      </div>
      { generated['text'] ? 
      <div id="outstream">
        {generated['src'] ? 
          <>
            <img src={generated['src']} alt="No img" /> 
          </> : <></>}
        <span className="caption">{generated['text']}</span>
      </div> : <></> }
    </div>
  );
}

export default App;
