import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './user.type';

@Injectable()
export class UserService {

  private anonymousCounter: number = 0;
  // client's id to an object
  private users: Map<string, User>;

  public add(clientId: string): any {
    const user = new User();
    user.name = 'anonymous_' + this.anonymousCounter++;
    user.id = clientId;
    user.seen = Date.now();
    this.users.set(clientId, user);
  }

  public get(clientId: string): User | null {
    return this.users.get(clientId) || null;
  }

  public remove(clientId: string): void {
    this.users.delete(clientId);
  }

  public removeInactive(threshold: number): string[] {
    const removedIds = [];

    for (const [clientId, user] of this.users.entries()) {
      if (Date.now() - user.seen > threshold) {
        this.remove(clientId);
      }
      removedIds.push(clientId);
    }

    return removedIds;
  }

  public rename(clientId: string, newName: string): void {
    const user = this.users.get(clientId);
    if (user == null) {
      throw new NotFoundException();
    }

    user.name = newName;
    this.users.set(clientId, user);
  }

  public updatePresence(clientId: string): void {
    const user = this.users.get(clientId);
    if (user == null) {
      throw new NotFoundException();
    }

    user.seen = Date.now();
    this.users.set(clientId, user);
  }
}
