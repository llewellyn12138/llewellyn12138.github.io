const art = new Artplayer({
    container: '.artplayer-app',
    url: 'Res/heidi.mp4',
    settings: [
        {
            width: 200,
            html: 'Subtitle',
            tooltip: 'Bilingual',
            // icon: '<img width="22" heigth="22" src="/assets/img/subtitle.svg">',
            selector: [
                {
                    html: 'Display',
                    tooltip: 'Show',
                    switch: true,
                    onSwitch: function (item) {
                        item.tooltip = item.switch ? 'Hide' : 'Show';
                        art.subtitle.show = !item.switch;
                        return !item.switch;
                    },
                },
                {
                    default: true,
                    html: 'heidi',
                    url: 'Res/heidi.ass',
                },
                {
                    html: 'ass',
                    url: 'Res/heidi.ass',
                },
                {
                    html: 'srt',
                    url: 'Res/heidi.srt',
                },
            ],
            onSelect: function (item) {
                art.subtitle.switch(item.url, {
                    name: item.html,
                });
                return item.html;
            },
        },
        {
            html: 'Switcher',
            // icon: '<img width="22" heigth="22" src="/assets/img/state.svg">',
            tooltip: 'OFF',
            switch: false,
            onSwitch: function (item) {
                item.tooltip = item.switch ? 'OFF' : 'ON';
                console.info('You clicked on the custom switch', item.switch);
                return !item.switch;
            },
        },
        {
            html: 'Slider',
            // icon: '<img width="22" heigth="22" src="/assets/img/state.svg">',
            tooltip: '5x',
            range: [5, 1, 10, 0.1],
            onRange: function (item) {
                return item.range + 'x';
            },
        },
    ],

    subtitle:
    {
        url: 'Res/heidi.ass',
        type: 'srt',
        encoding: 'gbk',
    },
});