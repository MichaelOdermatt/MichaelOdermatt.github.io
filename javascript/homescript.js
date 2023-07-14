// TODO rename some of the ids?
const selectors = Object.freeze({
    monitor: {
        parent: '#monitor',
        screen: '#monitor_screen',
        screenText: '#screen_text',
        powerBtnLight: '#monitor_power_button_light',
    },
    plugElement: '#plug',
    cord: {
        path: '#cord',
        svg: '#cord_svg',
        endDiv: '#cord_end',
        cordMeetsMonitor: '#cord_meets_monitor',
        largeProng: '#large_prong_male',
        smallProng: '#small_prong_male',
    },
    boundryBox: '#boundry_box', // TODO should this be bounding box?
    socketDiv: '#socket_div',
    touchscreenBtn: '#touchscreen_button',
});
 
let is_plugged_in = false;
let is_holding = false;
let is_hovering = false;
let plug_x = 0;
let plug_y = 0;
let plug_offset_x = 55;
let plug_offset_y = 25;
let cord_offset_min = 100;
let cord_offset_max = 200;
let cord_svg_ceil = getElementOffset(document.querySelector(selectors.monitor.parent)).top;
let play_area_floor = 0;
let play_area_ceil = 0;
let play_area_wall_left = 0;
let play_area_wall_right = 0;
let plug_element = document.querySelector(selectors.plugElement);
let cord_element = document.querySelector(selectors.cord.path)
let cord_svg = document.querySelector(selectors.cord.svg)
let socket_offset_from_center_y = 31;
let socket_offset_from_wall_left_x = 0;
let socket_hitbox_size = 5;
let socket_x = 0;
let socket_y = 0;
let depth_of_socket = 36;
let cord_svg_border_size = 5;
let small_prong_female_x_offset = 9;
let has_sound_click_played = false;
let sound_click = new Audio("sounds/click.mp3");

// update the boundries of where the plug can exist
update_screen_dependent_variables();
move_plug(get_play_area_center_x(), play_area_ceil + get_play_area_height_half());

// when the mouse cursor is over the plug
plug_element.addEventListener('mouseover', () => {
    is_hovering = true;
});

// when the mosue cursor is no longer over the plug
plug_element.addEventListener('mouseout', () => {
    is_hovering = false;
});

// when the mouse moves
window.addEventListener('mousemove', (event) => {
    if (is_holding) {
        move_plug(event.pageX, event.pageY);
    }
});

// when the left mouse button is pressed
window.addEventListener('mousedown', () => {
    if (is_hovering) {
        is_holding = true;
    }
});

// when the left mouse button is let go
window.addEventListener('mouseup', () => {
    if (is_holding) {
        is_holding = false;
    }
});

// button for users on mobile devices (the plug cant be moved on mobile/touchscreen devices)
document.querySelector(selectors.touchscreenBtn).addEventListener('click', (e) => {
    e.preventDefault();
    move_plug_to_socket();
    return false;
});

// on window resize, update the plug position and the bounding box where the plug can exist
window.addEventListener('resize', () => {
    update_screen_dependent_variables();
    move_plug(plug_x, plug_y);
});

// function to encapsulate all plug movement logic
function move_plug(new_x, new_y) {
    update_plug_position(new_x, new_y)
    check_plug_collision();
    update_plug_element_position();
    update_cord();
}

// function to update the x and y of the plug
function update_plug_position(newX, newY) {
    plug_x = newX - plug_offset_x;
    plug_y = newY - plug_offset_y;
}

// update the position of the SVG representing the plug with the plug objects x and y
function update_plug_element_position() {
    plug_element.style.left = `${plug_x}px`;
    plug_element.style.top = `${plug_y}px`;
}

// function to update cord position
function update_cord() {

    // move the svg element
    cord_svg.style.left = `${play_area_wall_left}px`;
    cord_svg.style.top = `${cord_svg_ceil}px`;

    // resize the svg element to match the bounding box
    const cordSvgWidth = play_area_wall_right - play_area_wall_left + cord_svg_border_size;
    const cordSvgHeight = play_area_floor - cord_svg_ceil + cord_svg_border_size;

    cord_svg.setAttribute('width', cordSvgWidth + "px");
    cord_svg.setAttribute('height', cordSvgHeight + "px");

    // calculate the end point and start point coordinates
    const cordMeetsMonitorOffset = getElementOffset(document.querySelector(selectors.cord.cordMeetsMonitor));

    var cord_end_x = cordMeetsMonitorOffset.left - play_area_wall_left;
    var cord_end_y = cordMeetsMonitorOffset.top - cord_svg_ceil;

    var cord_start_x = (plug_x + plug_offset_x) - play_area_wall_left;
    var cord_start_y = (plug_y + plug_offset_y) - cord_svg_ceil;

    // calculate the curve for the path
    var curve = calc_curve(cord_start_x, cord_start_y, cord_end_x, cord_end_y, cord_end_x);

    cord_element.setAttribute("d", curve)
}

// update the boundries of the play area
function update_play_area() {
    const socketDiv = document.querySelector(selectors.socketDiv);
    const socketDivOffset = getElementOffset(socketDiv);
    const socketDivAbsoluteWidth = getAbsoluteWidth(socketDiv);

    const boundingBox = document.querySelector(selectors.boundryBox)
    const boundingBoxAbsoluteHeight = getAbsoluteHieght(boundingBox);
    const boundingBoxAbsoluteWidth = getAbsoluteWidth(boundingBox);
    const boundingBoxOffset = getElementOffset(boundingBox);

    play_area_floor = boundingBoxOffset.top + boundingBoxAbsoluteHeight;
    play_area_ceil = boundingBoxOffset.top;
    play_area_wall_left = socketDivOffset.left + socketDivAbsoluteWidth / 2;
    play_area_wall_right = boundingBoxOffset.left + boundingBoxAbsoluteWidth;
}

function update_cord_svg_ceil() {
    cord_svg_ceil = getElementOffset(document.querySelector(selectors.monitor.parent)).top;
}

// check if the plug is colliding with any of the play area boundries
function check_plug_collision() {
    if (is_plugged_in == false) {

        // check collision with play area walls
        check_hit_floor();
        check_hit_ceil();
        check_hit_wall_left();
        check_hit_wall_right();

        is_plugged_in = has_plug_hit_socket();

    } else {

        // if the socket is plugged in, lock its y value and change the left and right boundries
        plug_y = socket_y;
        check_hit_end_of_socket();
        check_hit_wall_right();
        shift_prongs();
        is_plugged_in = has_plug_exited_socket();
    }
}

// function to prevent plug from exceeding its upper Y boundry
function check_hit_floor() {
    var boundry = play_area_floor - plug_element.getAttribute("height");
    plug_y = constrain_upper(plug_y, boundry)
}

// function to prevent plug from exceeding its lower Y boundry
function check_hit_ceil() {
    plug_y = constrain_lower(plug_y, play_area_ceil)
}

// function to prevent plug from exceeding its lower X boundry
function check_hit_wall_left() {
    plug_x = constrain_lower(plug_x, play_area_wall_left)

}

// check if you have collided with the socket hitbox
function has_plug_hit_socket() {
    var socket_hitbox_y_lower = (socket_y) - socket_hitbox_size;
    var socket_hitbox_y_upper = (socket_y) + socket_hitbox_size;

    if (plug_y <= socket_hitbox_y_upper && plug_y >= socket_hitbox_y_lower && plug_x == play_area_wall_left) {
        return true;
    } else {
        return false;
    }
}

// checks if the plug is pulled out far enough (if plug_x exceeds the left wall by 1 or more units)
function has_plug_exited_socket() {
    if (plug_y == socket_y && plug_x >= play_area_wall_left + 1) {
        return false;
    } else {
        return true;
    }
}

// function to prevent plug from exceeding its lower X socket boundry
function check_hit_end_of_socket() {
    var boundry = play_area_wall_left - depth_of_socket;

    plug_x = constrain_lower(plug_x, boundry)
    play_sound_click_if_hit_boundry(plug_x, boundry);
}

// function to prevent plug from exceeding its upper X boundry
function check_hit_wall_right() {
    var boundry = play_area_wall_right - plug_element.getAttribute("width");
    plug_x = constrain_upper(plug_x, boundry)
}

// if a value has hit a limit, play the click sound
function play_sound_click_if_hit_boundry(value, constraint) {
    if (value == constraint && has_sound_click_played == false) {
        sound_click.play();
        has_sound_click_played = true;
        screen_on();
    }

    if (value != constraint && has_sound_click_played == true) {
        has_sound_click_played = false;
        screen_off();
    }
}

// constrains a value to a upper boundry
function constrain_upper(value, constraint) {
    if (value > constraint) {
        return constraint;
    } else {
        return value
    }
}

// constrains a value to a lower boundry
function constrain_lower(value, constraint) {
    if (value < constraint) {
        return constraint;
    } else {
        return value
    }
}

// calculate quadratic
function calc_curve(cord_start_x, cord_start_y, cord_end_x, cord_end_y, cord_length_max) {

    // mid-point of line
    var mpx = (cord_end_x + cord_start_x) * 0.5;
    var mpy = (cord_end_y + cord_start_y) * 0.5;

    // angle perpendicular to the horizontal
    var theta = Math.atan2(0, cord_end_x - cord_start_x) - Math.PI / 2;

    // flips the offset sign depending on which point is bigger on the x axis
    var offset = -800;

    if (cord_start_x > cord_end_x) {
        offset *= -1;
    }

    // location of control point
    var c1x = mpx + offset * Math.cos(theta);
    var c1y = mpy + offset * Math.sin(theta);
    c1y = constrain_upper(c1y, get_cord_svg_height());

    return "M" + cord_start_x + " " + cord_start_y + " Q " + c1x + " " + c1y + " " + cord_end_x + " " + cord_end_y;
}

// calculates distance of control point from mid-point of line
function calc_offset(cord_start_x, cord_end_x, cord_start_y, cord_start_y, cord_length_max) {
    var length_of_x = Math.pow(cord_end_x - cord_start_x, 2);
    var length_of_y = Math.pow(cord_end_y - cord_start_y, 2);
    var length_of_cord = Math.sqrt(length_of_x + length_of_y);

    var cord_length_ratio = 1 - (length_of_cord / cord_length_max);

    return -1 * ((cord_length_ratio * cord_offset_max) + cord_offset_min);
}

// function for when the screen turns on
function screen_on() {
    const monitorScreen = document.querySelector(selectors.monitor.screen);
    const screenText = document.querySelector(selectors.monitor.screenText);
    const powerBtnLight = document.querySelector(selectors.monitor.powerBtnLight);

    monitorScreen.setAttribute("fill", "#FFFFFA");
    monitorScreen.setAttribute("stroke", "#FFFFFA");
    powerBtnLight.setAttribute("fill", "#86cc8a");
    screenText.setAttribute("class", "");
}

// function for when the screen turns off
function screen_off() {
    const monitorScreen = document.querySelector(selectors.monitor.screen);
    const screenText = document.querySelector(selectors.monitor.screenText);
    const powerBtnLight = document.querySelector(selectors.monitor.powerBtnLight);

    monitorScreen.setAttribute("fill", "#9A9286");
    monitorScreen.setAttribute("stroke", "#9A9286");
    powerBtnLight.setAttribute("fill", "#9A8686");
    screenText.setAttribute("class", "visibility-none");
}

// function to handle the shifting prongs
function shift_prongs() {
    var female_large_prong_x = play_area_wall_left;
    var small_prong_female_x = play_area_wall_left - small_prong_female_x_offset;

    var male_large_prong_x = plug_x;
    var small_prong_male_x = plug_x - small_prong_female_x_offset;

    const largeProng = document.querySelector(selectors.cord.largeProng);
    const smallProng = document.querySelector(selectors.cord.smallProng);
    // if the male prongs have moved past the female prongs
    if (female_large_prong_x >= male_large_prong_x) {
        var offset_large = female_large_prong_x - male_large_prong_x;
        var offset_small = small_prong_female_x - small_prong_male_x;

        largeProng.setAttribute("x", offset_large);
        smallProng.setAttribute("x", offset_small + small_prong_female_x_offset);
    } else {
        largeProng.setAttribute("x", 0);
        smallProng.setAttribute("x", small_prong_female_x_offset);
    }
}

// update socket and its hitboxes x and y values
function update_socket_position() {
    socket_x = play_area_wall_left - socket_offset_from_wall_left_x;
    socket_y = get_play_area_height_half() + play_area_ceil - socket_offset_from_center_y;
}

// encapsulating function for updating the play area and its requried parameters
function update_screen_dependent_variables() {
    update_play_area();
    update_cord_svg_ceil();
    update_socket_position();
}

// instantly moves the plug to the socket
function move_plug_to_socket() {
    is_plugged_in = true;
    move_plug(socket_x, socket_y);
}

function get_play_area_center_x() {
    return (play_area_wall_left + play_area_wall_right) / 2;
}

function get_play_area_height_half() {
    return (play_area_floor - play_area_ceil) / 2;
}

function get_play_area_height() {
    return play_area_floor - play_area_ceil;
}

function get_cord_svg_height() {
    return play_area_floor - cord_svg_ceil;
}
