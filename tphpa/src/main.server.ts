import { renderApplication } from '@angular/platform-server';
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = () => renderApplication((context: BootstrapContext) => bootstrapApplication(App, config, context), {});

export default bootstrap;
