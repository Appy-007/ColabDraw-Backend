/* eslint-disable @typescript-eslint/no-unsafe-return */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Room } from './schemas/room.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRoomDTO, JoinRoomDTO } from './dto/create-room.dto';
import { UserService } from 'src/user/user.service';

const TEST_WORDS = [
  'ANCHOR',
  'APPLE',
  'ARMCHAIR',
  'ASTRONAUT',
  'AVOCADO',
  'BALLOON',
  'BANANA',
  'BATTERY',
  'BEACH',
  'BICYCLE',
  'BINOCULARS',
  'BIRD',
  'BOTTLE',
  'BOWTIE',
  'BRAIN',
  'BREAD',
  'BRIDGE',
  'BROCCOLI',
  'BURGER',
  'BUS',
  'BUTTERFLY',
  'CACTUS',
  'CAKE',
  'CAMERA',
  'CANDLE',
  'CANOE',
  'CARROT',
  'CASTLE',
  'CAT',
  'CHAIR',
  'CHERRY',
  'CHESS',
  'CHICKEN',
  'CLOCK',
  'CLOUD',
  'COFFEE',
  'COMPASS',
  'COMPUTER',
  'COOKIE',
  'COWBOY',
  'CROWN',
  'DIAMOND',
  'DINOSAUR',
  'DOLPHIN',
  'DONUT',
  'DRAGON',
  'DRUM',
  'EGG',
  'ELEPHANT',
  'EYEGLASSES',
  'FEATHER',
  'FIRETRUCK',
  'FLAMINGO',
  'FLASHLIGHT',
  'FLOWER',
  'FORK',
  'FROG',
  'GIRAFFE',
  'GUITAR',
  'HAMMER',
  'HELICOPTER',
  'HOTDOG',
  'ICEBERG',
  'IGLOO',
  'JACKET',
  'JELLYFISH',
  'KANGAROO',
  'KEYBOARD',
  'KITE',
  'KNIGHT',
  'LADDER',
  'LAMP',
  'LEAF',
  'LIGHTHOUSE',
  'LION',
  'MAGNET',
  'MERMAID',
  'MICROSCOPE',
  'MIRROR',
  'MOON',
  'MOUNTAIN',
  'MUSHROOM',
  'OCTOPUS',
  'OWL',
  'PAINTBRUSH',
  'PALMTREE',
  'PANCAKE',
  'PARROT',
  'PENCIL',
  'PENGUIN',
  'PIANO',
  'PIZZA',
  'PYRAMID',
  'RABBIT',
  'RAINBOW',
  'ROBOT',
  'ROCKET',
  'ROLLERBLADE',
  'SAILBOAT',
  'SANDWICH',
  'SATURN',
  'SAXOPHONE',
  'SCARECROW',
  'SCISSORS',
  'SCORPION',
  'SHARK',
  'SHIELD',
  'SKATEBOARD',
  'SKELETON',
  'SNAKE',
  'SNOWMAN',
  'SPACESHIP',
  'SPIDER',
  'SPOON',
  'SQUIRREL',
  'STARFISH',
  'STETHOSCOPE',
  'STRAWBERRY',
  'SUBMARINE',
  'SUNFLOWER',
  'SUNGLASSES',
  'SWORD',
  'T-REX',
  'TABLE',
  'TACO',
  'TEAPOT',
  'TELESCOPE',
  'TENT',
  'TIGER',
  'TOASTER',
  'TOILET',
  'TOMATO',
  'TOOTHBRUSH',
  'TORCH',
  'TORNADO',
  'TRACTOR',
  'TRAIN',
  'TREASURE',
  'TREE',
  'TRICYCLE',
  'TROPHY',
  'TRUMPET',
  'TURTLE',
  'UMBRELLA',
  'UNICORN',
  'VAMPIRE',
  'VASE',
  'VIOLIN',
  'VOLCANO',
  'WAGON',
  'WATCH',
  'WATERFALL',
  'WATERMELON',
  'WHALE',
  'WHEEL',
  'WINDMILL',
  'WITCH',
  'WIZARD',
  'WOLF',
  'WRENCH',
  'XYLOPHONE',
  'YACHT',
  'YOYO',
  'ZEBRA',
  'ZOMBIE',
  'ACORN',
  'AIRPLANE',
  'ALADDIN',
  'ALARM',
  'ALBATROSS',
  'ALBUM',
  'ALIBI',
  'ALLEY',
  'ALLIGATOR',
  'ALPHABET',
  'AMBULANCE',
  'AMOEBA',
  'AMULET',
  'ANGEL',
  'ANGLERFISH',
  'ANT',
  'ANTEATER',
  'ANTELOPE',
  'ANTENNA',
  'ANVIL',
  'APARTMENT',
  'APRON',
  'AQUARIUM',
  'ARCH',
  'ARCHER',
  'ARM',
  'ARMADILLO',
  'ARMOR',
  'ARROW',
  'ARTIST',
  'ASH',
  'ASPARAGUS',
  'ATMOSPHERE',
  'ATTIC',
  'AVALANCHE',
  'AXE',
  'BABOON',
  'BABY',
  'BACKPACK',
  'BACON',
  'BADGE',
  'BADGER',
  'BAGEL',
  'BAGPIPE',
  'BAKERY',
  'BALL',
  'BALLET',
  'BAMBOO',
  'BANJO',
  'BARN',
  'BAROMETER',
  'BARREL',
  'BASEBALL',
  'BASKET',
  'BASKETBALL',
  'BAT',
  'BATH',
  'BATHTUB',
  'BEACHBALL',
  'BEAD',
  'BEAK',
  'BEAN',
  'BEANBAG',
  'BEARD',
  'BEAVER',
  'BED',
  'BEE',
  'BEEHIVE',
  'BEET',
  'BEETLE',
  'BELL',
  'BELT',
  'BENCH',
  'BERRY',
  'BIB',
  'BISON',
  'BLACKBERRY',
  'BLADE',
  'BLANKET',
  'BLENDER',
  'BLIMP',
  'BLOCK',
  'BLUEBERRY',
  'BOAR',
  'BOAT',
  'BOBCAT',
  'BONE',
  'BONFIRE',
  'BONGO',
  'BOOK',
  'BOOKCASE',
  'BOOMERANG',
  'BOOT',
  'BOTTLECAP',
  'BOULDER',
  'BOW',
  'BOWL',
  'BOX',
  'BRACELET',
  'BRANCH',
  'BRICK',
  'BROOM',
  'BRUSH',
  'BUCKET',
  'BUCKLE',
  'BUFFALO',
  'BUG',
  'BULB',
  'BULL',
  'BULLDOZER',
  'BUN',
  'BUNNY',
  'BUOY',
  'BURRITO',
  'BUSH',
  'BUTTER',
  'BUTTON',
  'CABBAGE',
  'CABIN',
  'CABINET',
  'CABLE',
  'CAGE',
  'CALENDAR',
  'CALF',
  'CAMEL',
  'CAMPFIRE',
  'CAN',
  'CANARY',
  'CANDY',
  'CANE',
  'CANNON',
  'CANTEEN',
  'CANVAS',
  'CAP',
  'CAPE',
  'CAPSULE',
  'CAR',
  'CARAVAN',
  'CARD',
  'CARDBOARD',
  'CAROUSEL',
  'CARPENTER',
  'CARPET',
  'CART',
  'CARTOON',
  'CASH',
  'CASSETTE',
  'CASTLE',
  'CATAPULT',
  'CATERPILLAR',
  'CAVE',
  'CAVIAR',
  'CELLO',
  'CEREAL',
  'CHAIN',
  'CHALK',
  'CHAMELEON',
  'CHAMPAGNE',
  'CHANDELIER',
  'CHEEK',
  'CHEESE',
  'CHEETAH',
  'CHEF',
  'CHERRY',
  'CHEST',
  'CHIME',
  'CHIMNEY',
  'CHIMPANZEE',
  'CHIN',
  'CHIPMUNK',
  'CHISEL',
  'CHOCOLATE',
  'CHOPSTICKS',
  'CHURCH',
  'CIGAR',
  'CIRCLE',
  'CITY',
  'CLAM',
  'CLAW',
  'CLAY',
  'CLIFF',
  'CLOAK',
  'CLOG',
  'CLOSET',
  'CLOTH',
  'CLOVER',
  'CLOWN',
  'CLUB',
  'COACH',
  'COAL',
  'COASTER',
  'COAT',
  'COBRA',
  'COBWEB',
  'COCONUT',
  'COCOON',
  'CODFISH',
  'COFFIN',
  'COIL',
  'COIN',
  'COKE',
  'COLLAR',
  'COLLEGE',
  'COLT',
  'COMB',
  'COMET',
  'COMIC',
  'CONE',
  'COOK',
  'COOLER',
  'COOP',
  'COPPER',
  'CORAL',
  'CORD',
  'CORK',
  'CORN',
  'CORNET',
  'COTTON',
  'COUCH',
  'COUGAR',
  'COUNT',
  'COUPON',
  'COURT',
  'COUSIN',
  'COVER',
  'COW',
  'COYOTE',
  'CRAB',
  'CRACKER',
  'CRANE',
  'CRATER',
  'CRAYON',
  'CREAM',
  'CREEK',
  'CRESCENT',
  'CRIB',
  'CRICKET',
  'CROCODILE',
  'CROSS',
  'CROW',
  'CROWBAR',
  'CRYSTAL',
  'CUBE',
  'CUCKOO',
  'CUCUMBER',
  'CUFF',
  'CUP',
  'CUPBOARD',
  'CUPCAKE',
  'CURTAIN',
  'CUSHION',
  'CYLINDER',
  'CYMBAL',
  'DAD',
  'DAGGER',
  'DAISY',
  'DAM',
  'DANCE',
  'DART',
  'DASHBOARD',
  'DATA',
  'DATE',
  'DEER',
  'DESK',
  'DESSERT',
  'DIAL',
  'DIARY',
  'DICE',
  'DIET',
  'DIGGER',
  'DIMPLE',
  'DINNER',
  'DIPSTICK',
  'DIRT',
  'DISH',
  'DISK',
  'DIVER',
  'DOCK',
  'DOCTOR',
  'DOG',
  'DOLL',
  'DOLLAR',
  'DOOR',
  'DOORKNOB',
  'DOT',
  'DRAIN',
  'DRAWER',
  'DRESS',
  'DRESSER',
  'DRILL',
  'DRINK',
  'DRIP',
  'DRIVE',
  'DRIVER',
  'DROP',
  'DRUG',
  'DRUID',
  'DRYAD',
  'DUCK',
  'DUCKLING',
  'DUEL',
  'DUET',
  'DUFFEL',
  'DUGOUT',
  'DUMPLING',
  'DUNE',
  'DUNGEON',
  'DUST',
  'DUSTER',
  'DWARF',
  'EAGLE',
  'EAR',
  'EARMUFFS',
  'EARRING',
  'EARTH',
  'EARTHQUAKE',
  'EASEL',
  'EEL',
  'EGGPLANT',
  'ELBOW',
  'ELDER',
  'ELF',
  'ELK',
  'ELM',
  'EMERALD',
  'ENGINE',
  'ENVELOPE',
  'ERASER',
  'ESKIMO',
  'ESPRESSO',
  'EYE',
  'EYEBROW',
  'FACE',
  'FAIRY',
  'FALCON',
  'FAN',
  'FARM',
  'FARMER',
  'FAUCET',
  'FEAST',
  'FENCE',
  'FERN',
  'FERRY',
  'FIELD',
  'FIG',
  'FILE',
  'FIN',
  'FINGER',
  'FIRE',
  'FIREFLY',
  'FIREPLACE',
  'FIREWORKS',
  'FISH',
  'FISHING',
  'FLAG',
  'FLASK',
  'FLAT',
  'FLEA',
  'FLIGHT',
  'FLIPPER',
  'FLOOD',
  'FLOOR',
  'FLOUR',
  'FLUTE',
  'FLY',
  'FOAM',
  'FOG',
  'FOLDER',
  'FOOD',
  'FOOT',
  'FOOTBALL',
  'FOREST',
  'FORT',
  'FOUNTAIN',
  'FOX',
  'FRAME',
  'FRECKLE',
  'FRIDGE',
  'FRISBEE',
  'FROST',
  'FRUIT',
  'FUDGE',
  'FUEL',
  'FUNNEL',
  'FUR',
];

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    private userService: UserService,
  ) {}

  private currentWordsForActiveRooms = {};

  setCurrentWordForActiveRooms(roomId: string, word: string) {
    this.currentWordsForActiveRooms[roomId] = word;
  }

  getCurrentWordForActiveRooms(roomId: string): string | undefined {
    return this.currentWordsForActiveRooms[roomId];
  }

  deleteRoomEntry(roomId: string) {
    delete this.currentWordsForActiveRooms[roomId];
  }

  async checkIfRoomExists(roomId: string) {
    const room = await this.roomModel.findOne({ roomId });
    if (!room) {
      throw new HttpException(
        'This roomId does not exists or has been expired',
        HttpStatus.BAD_REQUEST,
      );
    }

    return room;
  }

  selectRandomWord(): string {
    // 1. Generate a random index based on the array length
    const randomIndex = Math.floor(Math.random() * TEST_WORDS.length);

    // 2. Return the word at that index
    return TEST_WORDS[randomIndex];
  }

  async createRoom(payload: CreateRoomDTO, email: string = '') {
    const user = await this.userService.checkIfUserExists(email);
    if (!user) {
      throw new HttpException(
        'User does not exists...Try Login Again',
        HttpStatus.BAD_REQUEST,
      );
    }

    const now = new Date();
    const expirationTimeMs = now.getTime() + 1000 * 60 * 30;
    const expiredTime = new Date(expirationTimeMs);
    const roomData = {
      roomId: payload.roomId,
      roundsLeft: payload.rounds || 3,
      ownerName: payload.name,
      ownerEmailId: email,
      expiredTime,
      joinedUsers: [email],
      scoreBoard: [{ userId: email, username: payload.name, score: 0 }],
    };
    const response = await this.roomModel.create(roomData);
    return {
      message: 'Room Created successfully',
      data: response,
    };
  }

  async joinRoom(payload: JoinRoomDTO, email: string = '') {
    const roomInfo = await this.roomModel.findOne({ roomId: payload.roomId });
    console.log('IN JOIN room', roomInfo);
    if (!roomInfo) {
      throw new HttpException(
        'Room Id does not exists..Please check your roomId again',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userService.checkIfUserExists(email);
    if (!user) {
      throw new HttpException(
        'User does not exists...Try Login Again',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (roomInfo?.joinedUsers.length > 7) {
      throw new HttpException(
        'Sorry ...maximum members already joined the room',
        HttpStatus.BAD_REQUEST,
      );
    }

    const now = new Date();

    if (roomInfo?.expiredTime < now) {
      throw new HttpException(
        'Sorry ..roomId already expired',
        HttpStatus.BAD_REQUEST,
      );
    }

    const response = await this.roomModel.findOneAndUpdate(
      { roomId: roomInfo.roomId },
      {
        $addToSet: {
          joinedUsers: email,
          scoreBoard: { userId: email, username: payload.name, score: 0 },
        },
      },
      { new: true },
    );
    if (!response) {
      throw new HttpException(
        'Problem occured in database',
        HttpStatus.BAD_REQUEST,
      );
    }
    console.log('JOIN ROOM SOCKET COMPLETED');
    return {
      message: 'Room joined successfully',
      data: response,
    };
  }

  async removeUserFromRoom(roomId: string, email: string) {
    const roomData = await this.checkIfRoomExists(roomId);
    if (!roomData) {
      throw new HttpException(
        'Could not find any room with this Id',
        HttpStatus.BAD_REQUEST,
      );
    }

    const joinedUsersArr = roomData.joinedUsers;
    const updatedUsers = joinedUsersArr.filter((item) => item != email);
    console.log('EMAIL', email);
    console.log('UPDATED JOINED USER ARR AFTER DELETE', updatedUsers);
    const response = await this.roomModel.findOneAndUpdate(
      { roomId },
      { joinedUsers: updatedUsers },
      { new: true },
    );

    if (!response) {
      throw new HttpException(
        'Problem occured in updating database',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      message: 'User deleted successfully',
      data: response,
    };
  }

  async fetchRoomScoreBoard(roomId: string) {
    const roomData = await this.checkIfRoomExists(roomId);
    if (!roomData) {
      throw new HttpException(
        'Could not find any room with this Id',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      message: 'User deleted successfully',
      data: roomData?.scoreBoard,
    };
  }

  async updateScoreBoard(
    roomId: string,
    scoreBoard: { userId: string; username: string; score: number }[],
  ) {
    const roomData = await this.checkIfRoomExists(roomId);
    if (!roomData) {
      throw new HttpException(
        'Could not find any room with this Id',
        HttpStatus.BAD_REQUEST,
      );
    }

    const response = await this.roomModel.findOneAndUpdate(
      { roomId },
      { scoreBoard: scoreBoard },
      { new: true },
    );

    if (!response) {
      throw new HttpException(
        'Problem occured in updating database',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      message: 'User updated successfully',
      data: response,
    };
  }

  async updateRoomRound(roomId: string, round: number) {
    const roomData = await this.checkIfRoomExists(roomId);
    if (!roomData) {
      throw new HttpException(
        'Could not find any room with this Id',
        HttpStatus.BAD_REQUEST,
      );
    }

    const response = await this.roomModel.findOneAndUpdate(
      { roomId },
      { roundsLeft: round },
    );

    if (!response) {
      throw new HttpException(
        'Problem occured in updating database',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      message: 'Round updated successfully',
    };
  }
}
