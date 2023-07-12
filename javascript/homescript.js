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
 
//get cord end div
var cord_end_div = document.querySelector(selectors.cord.endDiv);

let is_plugged_in = false;
let is_holding = false;
let is_hovering = false;
let plug_x = 0;
let plug_y = 0;
let plug_offset_x = 55;
let plug_offset_y = 25;
let cord_offset_min = 100;
let cord_offset_max = 200;
let cord_shadow_offset = 50;
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

// function to encapsulate all plug movement logic
move_plug = function (new_x, new_y) {
    update_plug_position(new_x, new_y)
    check_plug_collision();
    update_plug_element_position();
    update_cord();
}

// function to update the x and y of the plug
update_plug_position = function (newX, newY) {
    plug_x = newX - plug_offset_x;
    plug_y = newY - plug_offset_y;
}

// update the position of the SVG representing the plug with the plug objects x and y
update_plug_element_position = function () {
    plug_element.style.left = `${plug_x}px`;
    plug_element.style.top = `${plug_y}px`;
}

// function to update cord position
update_cord = function () {

    // move the svg element
    cord_svg.style.left = `${play_area_wall_left}px`;
    cord_svg.style.top = `${cord_svg_ceil}px`;

    // resize the svg element to match the bounding box
    cord_svg.setAttribute('width', play_area_wall_right - play_area_wall_left + cord_svg_border_size + "px");
    cord_svg.setAttribute('height', play_area_floor - cord_svg_ceil + cord_svg_border_size + "px");

    // calculate the end point and start point coordinates
    var cord_end_x = getElementOffset(document.querySelector(selectors.cord.cordMeetsMonitor)).left - play_area_wall_left;
    var cord_end_y = getElementOffset(document.querySelector(selectors.cord.cordMeetsMonitor)).top - cord_svg_ceil;

    var cord_start_x = (plug_x + plug_offset_x) - play_area_wall_left;
    var cord_start_y = (plug_y + plug_offset_y) - cord_svg_ceil;

    // calculate the curve for the path
    var curve = calc_curve(cord_start_x, cord_start_y, cord_end_x, cord_end_y, cord_end_x);

    cord_element.setAttribute("d", curve)
}

// update the boundries of the play area
update_play_area = function () {
    play_area_floor = getElementOffset(document.querySelector(selectors.boundryBox)).top + getAbsoluteHieght(document.querySelector('#boundry_box'));
    play_area_ceil = getElementOffset(document.querySelector(selectors.boundryBox)).top;
    play_area_wall_left = getElementOffset(document.querySelector(selectors.socketDiv)).left + getAbsoluteWidth(document.querySelector('#socket_div')) / 2;
    play_area_wall_right = getElementOffset(document.querySelector(selectors.boundryBox)).left + getAbsoluteWidth(document.querySelector('#boundry_box'));
}

update_cord_svg_ceil = function () {
    cord_svg_ceil = getElementOffset(document.querySelector(selectors.monitor.parent)).top;
}

// check if the plug is colliding with any of the play area boundries
check_plug_collision = function () {
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
check_hit_floor = function () {
    var boundry = play_area_floor - plug_element.getAttribute("height");
    plug_y = constrain_upper(plug_y, boundry)
}

// function to prevent plug from exceeding its lower Y boundry
check_hit_ceil = function () {
    plug_y = constrain_lower(plug_y, play_area_ceil)
}

// function to prevent plug from exceeding its lower X boundry
check_hit_wall_left = function () {
    plug_x = constrain_lower(plug_x, play_area_wall_left)

}

// check if you have collided with the socket hitbox
has_plug_hit_socket = function () {
    var socket_hitbox_y_lower = (socket_y) - socket_hitbox_size;
    var socket_hitbox_y_upper = (socket_y) + socket_hitbox_size;

    if (plug_y <= socket_hitbox_y_upper && plug_y >= socket_hitbox_y_lower && plug_x == play_area_wall_left) {
        return true;
    } else {
        return false;
    }
}

// checks if the plug is pulled out far enough (if plug_x exceeds the left wall by 1 or more units)
has_plug_exited_socket = function () {
    if (plug_y == socket_y && plug_x >= play_area_wall_left + 1) {
        return false;
    } else {
        return true;
    }
}

// function to prevent plug from exceeding its lower X socket boundry
check_hit_end_of_socket = function () {
    var boundry = play_area_wall_left - depth_of_socket;

    plug_x = constrain_lower(plug_x, boundry)
    play_sound_click_if_hit_boundry(plug_x, boundry);
}

// function to prevent plug from exceeding its upper X boundry
check_hit_wall_right = function () {
    var boundry = play_area_wall_right - plug_element.getAttribute("width");
    plug_x = constrain_upper(plug_x, boundry)
}

// if a value has hit a limit, play the click sound
play_sound_click_if_hit_boundry = function (value, constraint) {
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
constrain_upper = function (value, constraint) {
    if (value > constraint) {
        return constraint;
    } else {
        return value
    }
}

// constrains a value to a lower boundry
constrain_lower = function (value, constraint) {
    if (value < constraint) {
        return constraint;
    } else {
        return value
    }
}

// calculate quadratic
calc_curve = function (cord_start_x, cord_start_y, cord_end_x, cord_end_y, cord_length_max) {

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
calc_offset = function (cord_start_x, cord_end_x, cord_start_y, cord_start_y, cord_length_max) {
    var length_of_x = Math.pow(cord_end_x - cord_start_x, 2);
    var length_of_y = Math.pow(cord_end_y - cord_start_y, 2);
    var length_of_cord = Math.sqrt(length_of_x + length_of_y);

    var cord_length_ratio = 1 - (length_of_cord / cord_length_max);

    return -1 * ((cord_length_ratio * cord_offset_max) + cord_offset_min);
}

// function for when the screen turns on
screen_on = function () {
    document.querySelector(selectors.monitor.screen).setAttribute("fill", "#FFFFFA");
    document.querySelector(selectors.monitor.screen).setAttribute("stroke", "#FFFFFA");
    document.querySelector(selectors.monitor.powerBtnLight).setAttribute("fill", "#86cc8a");
    document.querySelector(selectors.monitor.screenText).setAttribute("class", "");
}

// function for when the screen turns off
screen_off = function () {
    document.querySelector(selectors.monitor.screen).setAttribute("fill", "#9A9286");
    document.querySelector(selectors.monitor.screen).setAttribute("stroke", "#9A9286");
    document.querySelector(selectors.monitor.powerBtnLight).setAttribute("fill", "#9A8686");
    document.querySelector(selectors.monitor.screenText).setAttribute("class", "visibility-none");
}

// function to handle the shifting prongs
shift_prongs = function () {
    var female_large_prong_x = play_area_wall_left;
    var small_prong_female_x = play_area_wall_left - small_prong_female_x_offset;

    var male_large_prong_x = plug_x;
    var small_prong_male_x = plug_x - small_prong_female_x_offset;

    // if the male prongs have moved past the female prongs
    if (female_large_prong_x >= male_large_prong_x) {
        var offset_large = female_large_prong_x - male_large_prong_x;
        var offset_small = small_prong_female_x - small_prong_male_x;

        document.querySelector(selectors.cord.largeProng).setAttribute("x", offset_large);
        document.querySelector(selectors.cord.smallProng).setAttribute("x", offset_small + small_prong_female_x_offset);
    } else {
        document.querySelector(selectors.cord.largeProng).setAttribute("x", 0);
        document.querySelector(selectors.cord.smallProng).setAttribute("x", small_prong_female_x_offset);
    }
}

// update socket and its hitboxes x and y values
update_socket_position = function () {
    socket_x = play_area_wall_left - socket_offset_from_wall_left_x;
    socket_y = get_play_area_height_half() + play_area_ceil - socket_offset_from_center_y;
}

// encapsulating function for updating the play area and its requried parameters
update_screen_dependent_variables = function () {
    update_play_area();
    update_cord_svg_ceil();
    update_socket_position();
}

// instantly moves the plug to the socket
move_plug_to_socket = function () {
    is_plugged_in = true;
    move_plug(socket_x, socket_y);
}

//getters and setters
set_is_holding = function (bool) {
    is_holding = bool;
}

set_is_hovering = function (bool) {
    is_hovering = bool;
}

get_is_holding = function () {
    return is_holding;
}

get_is_hovering = function () {
    return is_hovering;
}

get_is_plugged_in = function () {
    return is_plugged_in;
}

get_play_area_floor = function () {
    return play_area_floor;
}

get_play_area_ceil = function () {
    return play_area_ceil;
}

get_play_area_center_x = function () {
    return (play_area_wall_left + play_area_wall_right) / 2;
}

get_play_area_height_half = function () {
    return (play_area_floor - play_area_ceil) / 2;
}

get_play_area_height = function () {
    return play_area_floor - play_area_ceil;
}

get_cord_svg_height = function () {
    return play_area_floor - cord_svg_ceil;
}

// CREATE THE PLUG

// update the boundries of where the plug can exist
update_screen_dependent_variables();
move_plug(get_play_area_center_x(), get_play_area_ceil() + get_play_area_height_half());

// when the mouse cursor is over the plug
plug_element.addEventListener('mouseover', function () {
    set_is_hovering(true);
});

// when the mosue cursor is no longer over the plug
plug_element.addEventListener('mouseout', function () {
    set_is_hovering(false);
});

// when the mouse moves
window.addEventListener('mousemove', (event) => {
    if (get_is_holding()) {
        move_plug(event.pageX, event.pageY);
    }
});

// when the left mouse button is pressed
window.addEventListener('mousedown', () => {
    if (get_is_hovering()) {
        set_is_holding(true);
    }
});

// when the left mouse button is let go
window.addEventListener('mouseup', () => {
    if (get_is_holding()) {
        set_is_holding(false);
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
