import { parse as parseYaml } from 'yaml';

export interface Config {
  owner: string;
  repo: string;
}

let cachedConfig: Config | null = null;

export async function loadConfig(): Promise<Config> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch(new URL('../../config.yaml', import.meta.url).href);
    if (!response.ok) {
      throw new Error('Failed to load config.yaml');
    }
    const yamlText = await response.text();
    const config = parseYaml(yamlText) as Config;
    
    if (!config.owner || !config.repo) {
      throw new Error('config.yaml must contain owner and repo fields');
    }
    
    cachedConfig = config;
    return config;
  } catch (error) {
    console.warn('Could not load config.yaml, using defaults:', error);
    return { owner: '', repo: '' };
  }
}
