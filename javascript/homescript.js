// TODO update all function comments, properly comment functions
// TODO go through all vars (including ones in functions) and make appropriate ones const
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
 
// TODO could I just use plug height and width / 2?
// plug_offset is a corrective value that we use when we calculate the correct x and y values for the plug
const plug_offset_x = 55;
const plug_offset_y = 25;
// TODO what is this?
const socket_offset_from_center_y = 31;
const socket_offset_from_wall_left_x = 0;
const socket_hitbox_size = 5;
const depth_of_socket = 36;
const cord_svg_border_size = 5;
// TODO rename this
const small_prong_female_x_offset = 9;
const sound_click = new Audio("sounds/click.mp3");
const plug_element = document.querySelector(selectors.plug_element);
const cord_element = document.querySelector(selectors.cord.path)
const cord_svg = document.querySelector(selectors.cord.svg)

let is_plugged_in = false;
// if the user has their cursor button held down while over the plug element.
let is_holding = false;
// if the user has their cursor over the plug element.
let is_hovering = false;
let plug_x = 0;
let plug_y = 0;
// the top y coordinate of the svg element used to draw the cord
let cord_svg_ceil = getElementOffset(document.querySelector(selectors.monitor.parent)).top;
// coordinates of the boundries in which the plug is able to move
let play_area_floor;
let play_area_ceil;
let play_area_wall_left;
let play_area_wall_right;
// the x and y coordinates of the socket hitbox
let socket_x;
let socket_y;
let has_sound_click_played = false;

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

/**
 * Given a new x and y coordinate, this function will update the location of the plug and cord. 
 * This function is intended to be run every time mouse movement is detected while the user
 * is holding the plug.
 * @param {*} new_x new x coordinate
 * @param {*} new_y new y coordinate
 */
function move_plug(new_x, new_y) {
    plug_x = new_x - plug_offset_x;
    plug_y = new_y - plug_offset_y;

    check_plug_collision();

    // update the position of the plug element
    plug_element.style.left = `${plug_x}px`;
    plug_element.style.top = `${plug_y}px`;

    update_cord();
}

/**
 * Updates the position of the cord and recalculates the curve of the cord.
 */
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

    const cord_end_x = cord_meets_monitor.left - play_area_wall_left;
    const cord_end_y = cord_meets_monitor.top - cord_svg_ceil;

    const cord_start_x = (plug_x + plug_offset_x) - play_area_wall_left;
    const cord_start_y = (plug_y + plug_offset_y) - cord_svg_ceil;

    // calculate the curve for the path
    var curve = calc_curve(cord_start_x, cord_start_y, cord_end_x, cord_end_y);

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

/**
 * Check if the plug is colliding with any of the play area boundries. If it is
 * prevent the plug from moving past that point. Also checks plug collisions with the socket
 */
function check_plug_collision() {
    const rightBoundry = play_area_wall_right - plug_element.getAttribute("width");
    const leftBoundry = play_area_floor - plug_element.getAttribute("height");

    if (is_plugged_in == false) {

        // check collision with play area walls

        // prevent plug from going past the upper and lower boundries
        plug_y = Math.min(plug_y, leftBoundry)
        plug_y = Math.max(plug_y, play_area_ceil)

        // prevent plug from going past the left and right boundries
        plug_x = Math.max(plug_x, play_area_wall_left)
        plug_x = Math.min(plug_x, rightBoundry)

        is_plugged_in = has_plug_hit_socket();

    } else {

        // if the socket is plugged in, lock its y value and change the left and right boundries
        plug_y = socket_y;
        check_hit_end_of_socket();
        plug_x = Math.min(plug_x, rightBoundry)
        shift_prongs();
        is_plugged_in = has_plug_exited_socket();
    }
}

/**
 * Checks if the plug has collided with the socket
 * @returns true if the plug is currently colliding with the socket and false if the it is not
 */
function has_plug_hit_socket() {
    const socket_hitbox_y_lower = (socket_y) - socket_hitbox_size;
    const socket_hitbox_y_upper = (socket_y) + socket_hitbox_size;

    if (plug_y <= socket_hitbox_y_upper && plug_y >= socket_hitbox_y_lower && plug_x == play_area_wall_left) {
        return true;
    } else {
        return false;
    }
}

/**
 * Checks if the plug is pulled out far enough (if plug_x exceeds the left wall by 1 or more units).
 * @returns true if the plug has been removed from the socket and false if it has not
 */
function has_plug_exited_socket() {
    if (plug_y == socket_y && plug_x >= play_area_wall_left + 1) {
        return false;
    } else {
        return true;
    }
}

/**
 * Prevents the plug from moving past the socket and plays the 'click' sound
 * effect once it reaches the back of the socket.
 */
function check_hit_end_of_socket() {
    const boundry = play_area_wall_left - depth_of_socket;

    // prevent the plug from moving too far past the socket
    plug_x = Math.max(plug_x, boundry)

    // play the click sound if the plug has hit the end of the socket
    if (plug_x == boundry && has_sound_click_played == false) {
        sound_click.play();
        has_sound_click_played = true;
        update_screen_to_be_on();
    } else if (plug_x != boundry && has_sound_click_played == true) {
        has_sound_click_played = false;
        update_screen_to_be_off();
    }
}

/**
 * Calculates the curve for the cord svg and returns a formatted string that can be set as the svg's path.
 * @param {*} cord_start_x the x position of the start of the cord
 * @param {*} cord_start_y the y position of the start of the cord
 * @param {*} cord_end_x the x position of the end of the cord
 * @param {*} cord_end_y the y position of the end of the cord
 * @returns a formatted string to be used as the path for the cord svg
 */
function calc_curve(cord_start_x, cord_start_y, cord_end_x, cord_end_y) {

    // mid-point of line
    const mpx = (cord_end_x + cord_start_x) * 0.5;
    const mpy = (cord_end_y + cord_start_y) * 0.5;

    // angle perpendicular to the horizontal
    const theta = Math.atan2(0, cord_end_x - cord_start_x) - Math.PI / 2;

    // flips the offset sign depending on which point is bigger on the x axis
    // TODO why is the offset set to 800?
    var offset = -800;

    if (cord_start_x > cord_end_x) {
        offset *= -1;
    }

    // location of control point
    const c1x = mpx + offset * Math.cos(theta);
    var c1y = mpy + offset * Math.sin(theta);
    c1y = Math.min(c1y, get_cord_svg_height());

    return "M" + cord_start_x + " " + cord_start_y + " Q " + c1x + " " + c1y + " " + cord_end_x + " " + cord_end_y;
}

/**
 * Updates the screen look as if it is turned on
 */
function update_screen_to_be_on() {
    update_screen_colors("#FFFFFA", "#86cc8a", true);
}

/**
 * Updates the screen look as if it is turned off
 */
function update_screen_to_be_off() {
    update_screen_colors("#9A9286", "#9A8686", false);
}

/**
 * Updates the monitor background color and power button light color. Also updates the
 * visibility of the screen text.
 * @param {*} monitor_screen_color the background color for the monitor
 * @param {*} power_btn_light_color the color of the power button light on the monitor
 * @param {*} show_screen_text a bool used to update the visibility of the screen text
 */
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
    const female_large_prong_x = play_area_wall_left;
    const small_prong_female_x = play_area_wall_left - small_prong_female_x_offset;

    const male_large_prong_x = plug_x;
    const small_prong_male_x = plug_x - small_prong_female_x_offset;

    const large_prong = document.querySelector(selectors.cord.large_prong);
    const small_prong = document.querySelector(selectors.cord.small_prong);
    // if the male prongs have moved past the female prongs
    if (female_large_prong_x >= male_large_prong_x) {
        const offset_large = female_large_prong_x - male_large_prong_x;
        const offset_small = small_prong_female_x - small_prong_male_x;

        large_prong.setAttribute("x", offset_large);
        small_prong.setAttribute("x", offset_small + small_prong_female_x_offset);
    } else {
        large_prong.setAttribute("x", 0);
        small_prong.setAttribute("x", small_prong_female_x_offset);
    }
}

/**
 * Updates the area in which the plug can be moved, the size and position of where the cord can be drawn, and
 * the position of the wall socket element.
 */
function update_screen_dependent_variables() {
    update_play_area();
    // update the size of the svg element that draws the cord
    cord_svg_ceil = getElementOffset(document.querySelector(selectors.monitor.parent)).top;

    // update the socket position
    socket_x = play_area_wall_left - socket_offset_from_wall_left_x;
    socket_y = get_play_area_height_half() + play_area_ceil - socket_offset_from_center_y;
}

/**
 * instantly set the plug position to be in the socket.
 */
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
