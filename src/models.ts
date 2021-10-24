export type DuckStates = 'Closed' | 'OpenBar' | 'OpenChillzone' | 'OpenEvent' | 'Private';

export interface DuckState {
    nextPlannedState?: DuckStates;
    nextStateDateTime?: string;
    nextOpeningDateTime?: string;
    state?: DuckStates;
    lastChange?: string;
    expectedEnd?: string;
    note?: string;
    openedByName?: string;
}

export interface EmailData {
    to: string;
    subject: string;
    text: string;
    html: string;
}
