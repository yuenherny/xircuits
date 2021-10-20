import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { addIcon, clearIcon, listIcon } from '@jupyterlab/ui-components';
import * as nbformat from '@jupyterlab/nbformat';
import LogLevelSwitcher from './logLevelSwitcher';
import {
  ICommandPalette,
  WidgetTracker} from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import {
  MainAreaWidget,
  CommandToolbarButton,
} from '@jupyterlab/apputils';
import {
  LoggerRegistry,
  LogConsolePanel,
  IHtmlLog,
  ITextLog,
  IOutputLog,
} from '@jupyterlab/logconsole';
import { commandIDs } from '../components/xpipeBodyWidget';

/**
 * The command IDs used by the log plugin.
 */
export namespace CommandIDs {
  export const addCheckpoint = 'Xpipe-log:add-checkpoint';
  export const clear = 'Xpipe-log:clear';
  export const openLog = 'Xpipe-log:open';
  export const setLevel = 'Xpipe-log:set-level';
}

/**
 * Initialization data for the log plugin.
 */
export const logPlugin: JupyterFrontEndPlugin<void> = {
  id: 'xpipe-log',
  autoStart: true,
  requires: [
    ICommandPalette,
    ILayoutRestorer,
    IRenderMimeRegistry
  ],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    restorer: ILayoutRestorer,
    rendermime: IRenderMimeRegistry
  ) => {

    console.log('Xpipe-Log is activated!');

    let logConsolePanel: LogConsolePanel = null;
    let logConsoleWidget: MainAreaWidget<LogConsolePanel> = null;

    const loggertracker = new WidgetTracker<MainAreaWidget<LogConsolePanel>>({
      namespace: 'Xpipe-log',
    });

    if (restorer) {
      void restorer.restore(loggertracker, {
        command: CommandIDs.openLog,
        name: () => 'Xpipe-log'
      });
    }
  
    app.commands.addCommand(CommandIDs.addCheckpoint, {
      execute: () => logConsolePanel?.logger?.checkpoint(),
      icon: addIcon,
      isEnabled: () => !!logConsolePanel && logConsolePanel.source !== null,
      label: 'Add Checkpoint',
    });
    app.commands.addCommand(CommandIDs.clear, {
      execute: () => logConsolePanel?.logger?.clear(),
      icon: clearIcon,
      isEnabled: () => !!logConsolePanel && logConsolePanel.source !== null,
      label: 'Clear Log',
    });
    app.commands.addCommand(CommandIDs.setLevel, {
      execute: (args: any) => {
        if (logConsolePanel?.logger) {
          logConsolePanel.logger.level = args.level;
        }
      },
      isEnabled: () => !!logConsolePanel && logConsolePanel.source !== null,
      label: (args) => `Set Log Level to ${args.level as string}`,
    });

    const createLogConsoleWidget = (): void => {
      logConsolePanel = new LogConsolePanel(
        new LoggerRegistry({
          defaultRendermime: rendermime,
          maxLength: 1000,
        })
      );

      logConsolePanel.source = 'xpipe';

      logConsoleWidget = new MainAreaWidget<LogConsolePanel>({
        content: logConsolePanel,
      });
      
      logConsoleWidget.addClass('jp-LogConsole');
      logConsoleWidget.title.label = 'Xpipe Log console';
      logConsoleWidget.title.icon = listIcon;

      logConsoleWidget.toolbar.addItem(
        'checkpoint',
        new CommandToolbarButton({
          commands: app.commands,
          id: CommandIDs.addCheckpoint,
        })
      );
      logConsoleWidget.toolbar.addItem(
        'clear',
        new CommandToolbarButton({
          commands: app.commands,
          id: CommandIDs.clear,
        })
      );
      logConsoleWidget.toolbar.addItem(
        'level',
        new LogLevelSwitcher(logConsoleWidget.content)
      );

      logConsoleWidget.disposed.connect(() => {
        logConsoleWidget = null;
        logConsolePanel = null;
        app.commands.notifyCommandChanged();
      });

      app.shell.add(logConsoleWidget, 'main', { mode: 'split-bottom' });
      loggertracker.add(logConsoleWidget);

      logConsoleWidget.update();
      app.commands.notifyCommandChanged();
    };

    app.commands.addCommand(CommandIDs.openLog, {
      label: 'Xpipe Log Console',
      caption: 'Xpipe log console',
      isToggled: () => logConsoleWidget !== null,
      execute: () => {
        if (logConsoleWidget) {
          logConsoleWidget.dispose();
        } else {
          createLogConsoleWidget();
        }
      },
    });

    palette.addItem({
      command: CommandIDs.openLog,
      category: 'Examples',
    });

    app.commands.addCommand('jlab-examples/custom-log-console:logHTMLMessage', {
      label: 'HTML log message',
      caption: 'Custom HTML log message example.',
      execute: () => {
        const msg: IHtmlLog = {
          type: 'html',
          level: 'debug',
          data: '<div>Hello world HTML!!</div>',
        };

        logConsolePanel?.logger?.log(msg);
      },
    });

    app.commands.addCommand('jlab-examples/custom-log-console:logTextMessage', {
      label: 'Text log message',
      caption: 'Custom text log message example.',
      execute: () => {
        const msg: ITextLog = {
          type: 'text',
          level: 'info',
          data: 'Hello world text!!',
        };

        logConsolePanel?.logger?.log(msg);
      },
    });

    app.commands.addCommand(commandIDs.outputMsg, {
      label: 'Output log message',
      caption: 'Output xpipe log message.',
      execute: args => {
        const outputMsg = typeof args['outputMsg'] === 'undefined' ? '' : (args['outputMsg'] as string);
        const setLevel = args['level'] as any;
        const data: nbformat.IOutput = {
          output_type: 'display_data',
          data: {
            'text/plain': outputMsg,
          },
        };

        const msg: IOutputLog = {
          type: 'output',
          level: setLevel,
          data,
        };

        logConsolePanel?.logger?.log(msg);
      },
    });
  
  },
};

/**
 * Interface for log severity level
 */
export interface LogInterface {

  /**
   * Set log severity level to debug
   */
  debug(primaryMessage: string, ...supportingData: any[]) : void;

  /**
   * Set log severity level to info
   */
  info(primaryMessage: string, ...supportingData: any[]) : void;

  /**
   * Set log severity level to warning
   */
  warn(primaryMessage: string, ...supportingData: any[]) : void;

  /**
   * Set log severity level to error
   */
  error(primaryMessage: string, ...supportingData: any[]) : void;

  /**
   * Set log severity level to critical
   */
  critical(primaryMessage: string, ...supportingData: any[]) : void;
}

/**
 * Emit output message to xpipe log based on severity level
 */
export class Log implements LogInterface {
  private app: JupyterFrontEnd;

  constructor(app: JupyterFrontEnd){
     this.app = app;
  }

  public debug(msg: string, ...supportingDetailes: any[]): void {
    this.emitLogMessage("debug", msg, supportingDetailes);
  }

  public info(msg: string, ...supportingDetailes: any[]): void {
    this.emitLogMessage("info", msg, supportingDetailes);
  }

  public warn(msg: string, ...supportingDetailes: any[]): void {
    this.emitLogMessage("warning", msg, supportingDetailes);
  }

  public error(msg: string, ...supportingDetailes: any[]): void {
    this.emitLogMessage("error", msg, supportingDetailes);
  }

  public critical(msg: string, ...supportingDetailes: any[]): void {
    this.emitLogMessage("critical", msg, supportingDetailes);
  }

  private emitLogMessage(
    msgType: "debug" | "info" | "warning" | "error" | "critical", 
    msg: string, 
    supportingDetailes: any[]
  ){
    
    if (supportingDetailes.length > 0) {
      const logMsg = msg + supportingDetailes;
      this.app.commands.execute(commandIDs.outputMsg,{
        outputMsg: logMsg,
        level: msgType
      });
    } else {
      this.app.commands.execute(commandIDs.outputMsg,{
        outputMsg: msg,
        level: msgType
      });
    }
  }
}