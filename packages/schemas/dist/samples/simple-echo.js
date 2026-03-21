/**
 * Sample flow: /start → greeting → wait for input → echo back.
 */
export const simpleEchoFlow = {
    nodes: [
        {
            id: 'trigger-start',
            type: 'command_trigger',
            config: { command: '/start' },
            position: { x: 0, y: 0 },
            label: 'Start Command',
        },
        {
            id: 'greet',
            type: 'send_message',
            config: { text: 'Hello! Send me a message and I will echo it back.' },
            position: { x: 0, y: 100 },
            label: 'Greeting',
        },
        {
            id: 'wait',
            type: 'wait_for_input',
            config: { variable: 'user_input', timeoutSecs: 300 },
            position: { x: 0, y: 200 },
            label: 'Wait for Input',
        },
        {
            id: 'echo',
            type: 'send_message',
            config: { text: 'You said: {{user_input}}' },
            position: { x: 0, y: 300 },
            label: 'Echo',
        },
    ],
    edges: [
        { id: 'e1', source: 'trigger-start', target: 'greet' },
        { id: 'e2', source: 'greet', target: 'wait' },
        { id: 'e3', source: 'wait', target: 'echo' },
    ],
};
//# sourceMappingURL=simple-echo.js.map