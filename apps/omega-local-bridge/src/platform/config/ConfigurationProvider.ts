export interface IConfigurationProvider {
  get(key: string): string | undefined;
  getRequired(key: string): string;
}

export class DotenvConfigProvider implements IConfigurationProvider {
  get(key: string): string | undefined {
    return process.env[key];
  }

  getRequired(key: string): string {
    const val = process.env[key];
    if (!val) {
      throw new Error(`Missing required configuration: ${key}`);
    }
    return val;
  }
}

export const globalConfig: IConfigurationProvider = new DotenvConfigProvider();
