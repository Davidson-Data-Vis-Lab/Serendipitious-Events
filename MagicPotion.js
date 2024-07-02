// Create sliders
const slider1 = document.getElementById('slider1');
const slider2 = document.getElementById('slider2');
const slider3 = document.getElementById('slider3');
const slider4 = document.getElementById('slider4');

function formatTooltip(value) {
    return parseFloat(value).toFixed(2);
}

// Single value slider (0-1)
noUiSlider.create(slider1, {
    start: [0],
    direction: 'rtl',
    orientation: 'vertical',
    connect: [true,false],
    range: {
        'max': 1,
        'min': 0
    },
    step: 1,
    tooltips: [wNumb({ decimals: 0 })]
});

// Range slider (1-10)
noUiSlider.create(slider2, {
    start: [2, 8],
    direction: 'rtl',
    orientation: 'vertical',
    connect: [false,true,false],
    range: {
        'max': 10,
        'min': 1
    },
    step: 1,
    tooltips: [wNumb({ decimals: 0 }), wNumb({ decimals: 0 })]
});

// Range slider (1-10)
noUiSlider.create(slider3, {
    start: [3, 7],
    direction: 'rtl',
    orientation: 'vertical',
    connect: [false,true,false],
    range: {
        'max': 10,
        'min': 1
    },
    step: 1,
    tooltips: [wNumb({ decimals: 0 }), wNumb({ decimals: 0 })]
});

// Range slider (1-100)
noUiSlider.create(slider4, {
    start: [18, 65],
    direction: 'rtl',
    orientation: 'vertical',
    connect: [false,true,false],
    range: {
        'max': 100,
        'min': 1
    },
    step: 1,
    tooltips: [wNumb({ decimals: 0 }), wNumb({ decimals: 0 })]
});
