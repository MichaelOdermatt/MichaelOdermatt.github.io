// TODO update all function comments, properly comment functions
const selectors = Object.freeze({
    monitor: {
        parent: '#monitor',
        screen: '#monitor_screen',
        screen_text: '#screen_text',
        power_btn_light: '#monitor_power_button_light',
    },
    plug_element: '#plug',
    cord: {
        path: '#cord',
        svg: '#cord_svg',
        cord_meets_monitor: '#cord_meets_monitor',
        large_prong: '#large_prong',
        small_prong: '#small_prong',
    },
    bounding_box: '#bounding_box',
    socket_div: '#socket_div',
    touchscreen_btn: '#touchscreen_button',
});
 
let is_plugged_in = false;
// if the user has their cursor button held down while over the plug element.
let is_holding = false;
// if the user has their cursor over the plug element.
let is_hovering = false;
let plug_x = 0;
let plug_y = 0;
let plug_offset_x = 55;
let plug_offset_y = 25;
let cord_offset_min = 100;
let cord_offset_max = 200;
// the top y coordinate of the svg element used to draw the cord
let cord_svg_ceil = getElementOffset(document.querySelector(selectors.monitor.parent)).top;
let play_area_floor = 0;
let play_area_ceil = 0;
let play_area_wall_left = 0;
let play_area_wall_right = 0;
let plug_element = document.querySelector(selectors.plug_element);
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
    is_holding = false;
});

// button for users on mobile devices (the plug cant be moved on mobile/touchscreen devices)
document.querySelector(selectors.touchscreen_btn).addEventListener('click', (e) => {
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
    const cord_svg_width = play_area_wall_right - play_area_wall_left + cord_svg_border_size;
    const cord_svg_height = play_area_floor - cord_svg_ceil + cord_svg_border_size;

    cord_svg.setAttribute('width', cord_svg_width + "px");
    cord_svg.setAttribute('height', cord_svg_height + "px");

    // calculate the end point and start point coordinates
    const cord_meets_monitor = getElementOffset(document.querySelector(selectors.cord.cord_meets_monitor));

    var cord_end_x = cord_meets_monitor.left - play_area_wall_left;
    var cord_end_y = cord_meets_monitor.top - cord_svg_ceil;

    var cord_start_x = (plug_x + plug_offset_x) - play_area_wall_left;
    var cord_start_y = (plug_y + plug_offset_y) - cord_svg_ceil;

    // calculate the curve for the path
    var curve = calc_curve(cord_start_x, cord_start_y, cord_end_x, cord_end_y, cord_end_x);

    cord_element.setAttribute("d", curve)
}

/**
 * Updates the size and location of the area on the screen in which the plug is able to move
 */
function update_play_area() {
    const socket_div = document.querySelector(selectors.socket_div);
    const socket_div_offset = getElementOffset(socket_div);
    const socket_div_absolute_width = getAbsoluteWidth(socket_div);

    const bounding_box = document.querySelector(selectors.bounding_box)
    const bounding_box_absolute_height = getAbsoluteHieght(bounding_box);
    const bounding_box_absolute_width = getAbsoluteWidth(bounding_box);
    const bounding_box_offset = getElementOffset(bounding_box);

    play_area_floor = bounding_box_offset.top + bounding_box_absolute_height;
    play_area_ceil = bounding_box_offset.top;
    play_area_wall_left = socket_div_offset.left + socket_div_absolute_width / 2;
    play_area_wall_right = bounding_box_offset.left + bounding_box_absolute_width;
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
    update_screen_colors("#FFFFFA", "#86cc8a", true);
}

// function for when the screen turns off
function screen_off() {
    update_screen_colors("#9A9286", "#9A8686", false);
}

function update_screen_colors(monitor_screen_color, power_btn_light_color, show_screen_text) {
    const monitor_screen = document.querySelector(selectors.monitor.screen);
    const screen_text = document.querySelector(selectors.monitor.screen_text);
    const power_btn_light = document.querySelector(selectors.monitor.power_btn_light);

    monitor_screen.setAttribute("fill", monitor_screen_color);
    monitor_screen.setAttribute("stroke", monitor_screen_color);
    power_btn_light.setAttribute("fill", power_btn_light_color);
    screen_text.setAttribute("class", show_screen_text ? "" : "visibility-none");
}

// function to handle the shifting prongs
function shift_prongs() {
    var female_large_prong_x = play_area_wall_left;
    var small_prong_female_x = play_area_wall_left - small_prong_female_x_offset;

    var male_large_prong_x = plug_x;
    var small_prong_male_x = plug_x - small_prong_female_x_offset;

    const large_prong = document.querySelector(selectors.cord.large_prong);
    const small_prong = document.querySelector(selectors.cord.small_prong);
    // if the male prongs have moved past the female prongs
    if (female_large_prong_x >= male_large_prong_x) {
        var offset_large = female_large_prong_x - male_large_prong_x;
        var offset_small = small_prong_female_x - small_prong_male_x;

        large_prong.setAttribute("x", offset_large);
        small_prong.setAttribute("x", offset_small + small_prong_female_x_offset);
    } else {
        large_prong.setAttribute("x", 0);
        small_prong.setAttribute("x", small_prong_female_x_offset);
    }
}

/**
 * Updates the x and y positions for the socket element
 */
function update_socket_position() {
    socket_x = play_area_wall_left - socket_offset_from_wall_left_x;
    socket_y = get_play_area_height_half() + play_area_ceil - socket_offset_from_center_y;
}

/**
 * Updates the area in which the plug can be moved, the size and position of where the cord can be drawn, and
 * the position of the wall socket element.
 */
function update_screen_dependent_variables() {
    update_play_area();
    // update the size of the svg element that draws the cord
    cord_svg_ceil = getElementOffset(document.querySelector(selectors.monitor.parent)).top;
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
