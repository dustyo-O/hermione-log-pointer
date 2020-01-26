module.exports = (hermione, options) => {
    const config = parseConfig(options);

    if (!config.enabled || !hermione.isWorker()) {
        return;
    }

    hermione.on(hermione.events.NEW_BROWSER, (browser) => {
        const baseYaOpenSerp = browser.yaOpenSerp.bind(browser);

        browser.addCommand('yaOpenSerp', async (query, selector, options, hash) => {
                await baseYaOpenSerp(query, selector, options, hash);
                await browser.execute(function(selector) {
                    document.addEventListener('click', function(e) {
                        var circle = document.createElement('div');

                        circle.style.position = 'absolute';
                        circle.style.zIndex = '100000000';

                        circle.style.width = '10px';
                        circle.style.height = '10px';
                        circle.style.borderRadius = '50%';
                        circle.style.background = 'red';

                        circle.style.top = e.pageY - 5 + 'px';
                        circle.style.left = e.pageX - 5 + 'px';

                        circle.style.pointerEvents = 'none';

                        document.body.appendChild(circle);
                    });

                    var point = { x: 0, y: 0 };
                    var moveLogger = document.createElement('canvas');
                    var ctx = moveLogger.getContext('2d');

                    if (!ctx) {
                        return;
                    }

                    ctx.lineWidth = 5;
                    moveLogger.style.position = 'absolute';
                    moveLogger.style.pointerEvents = 'none';
                    moveLogger.style.zIndex = '100000000';

                    moveLogger.width = window.innerWidth;

                    var mainElement = document.querySelector(selector);

                    moveLogger.height = mainElement ? mainElement.getBoundingClientRect().height : window.innerHeight;

                    document.body.insertBefore(moveLogger, document.body.firstElementChild);

                    document.addEventListener('mousemove', function(e) {
                        ctx.lineTo(point.x, point.y);

                        canvasArrow(ctx, point, { x: e.pageX, y: e.pageY });
                        point.x = e.pageX;
                        point.y = e.pageY;

                        ctx.stroke();
                    });

                    function canvasArrow(context, from, to) {
                        var headlen = 10; // Длина наконечника стрелки
                        var dx = to.x - from.x;
                        var dy = to.y - from.y;
                        var angle = Math.atan2(dy, dx);

                        context.moveTo(from.x, from.y);
                        context.lineTo(to.x, to.y);
                        context.lineTo(
                            to.x - headlen * Math.cos(angle - Math.PI / 6),
                            to.y - headlen * Math.sin(angle - Math.PI / 6)
                        );
                        context.moveTo(to.x, to.y);
                        context.lineTo(
                            to.x - headlen * Math.cos(angle + Math.PI / 6),
                            to.y - headlen * Math.sin(angle + Math.PI / 6)
                        );
                    }
                }, config.selector);
            },
            true
        );
    });
};

const createDebug = require('debug');
const { option, root, section } = require('gemini-configparser');
const parseArgs = require('yargs-parser');

const debug = createDebug("hermione-log-pointer:config");

const booleanOption = option({
    parseEnv: (val) => Boolean(JSON.parse(val)),
    parseCli: (val) => Boolean(JSON.parse(val)),
    defaultValue: false,
});

const stringOption = option({
    parseEnv: (val) => String(JSON.parse(val)),
    parseCli: (val) => String(JSON.parse(val)),
    defaultValue: false,
});

function parseConfig(options) {
    const { env, argv } = process;

    const parseOptions = root(
        section({
            enabled: booleanOption,
            selector: stringOption
        }),
        { envPrefix: "hermione_log_pointer_", cliPrefix: "--log_pointer-" },
    );

    const config = parseOptions({ options, env, argv });

    // Самостоятельно распарсим опции командной строки, чтобы включать плагин при указании --save-passed
    const { logPointer } = parseArgs(argv.slice(2), { boolean: ["log-pointer"] });

    if (logPointer) {
        config.enabled = true;
    }

    debug(`Конфигурация плагина: ${JSON.stringify(config, null, 4)}`);

    return config;
}
