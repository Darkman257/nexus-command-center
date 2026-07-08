export type CommandValidator = (payload: Record<string, unknown>) => void; // Throws an error if invalid
export type CommandHandler = (payload: Record<string, unknown>, meta: { commandId: string; issuedBy: string; expectedVersion?: number }) => Promise<Record<string, unknown> | null>; // Executes logic, returns event payload parameters or null if handled

export class CommandRegistry {
  private validators: Record<string, CommandValidator> = {};
  private handlers: Record<string, CommandHandler> = {};

  register(type: string, validator: CommandValidator, handler: CommandHandler) {
    this.validators[type] = validator;
    this.handlers[type] = handler;
  }

  getValidator(type: string): CommandValidator {
    const validator = this.validators[type];
    if (!validator) {
      throw new Error(`No validator registered for command type: ${type}`);
    }
    return validator;
  }

  getHandler(type: string): CommandHandler {
    const handler = this.handlers[type];
    if (!handler) {
      throw new Error(`No handler registered for command type: ${type}`);
    }
    return handler;
  }
}

export const globalCommandRegistry = new CommandRegistry();
