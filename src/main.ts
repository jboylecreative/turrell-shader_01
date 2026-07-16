// Entry point: mount the App into the pre-defined DOM skeleton.
import "./styles/app.css";
import { App } from "./app/App";

const canvas = document.getElementById("view") as HTMLCanvasElement;
const panel = document.getElementById("panel") as HTMLElement;
const overlay = document.getElementById("overlay") as HTMLElement;

const app = new App(canvas, panel, overlay);
app.start();
