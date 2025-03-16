// jest.setup.js
global.console = {
    ...console,
    log: jest.fn((...args) => {
        process.stdout.write(args.join(' ') + '\n');
    })
};